// Real API tests: the Express app runs against an in-memory MongoDB (mongodb-memory-server), so authentication,
// lead ownership and persistence are exercised end to end without touching any real database.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const crypto = require('node:crypto');

process.env.JWT_SECRET = crypto.randomBytes(48).toString('hex');
process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
process.env.AUTH_RATE_LIMIT_MAX = '10000';
process.env.NODE_ENV = 'test';

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;
let server;
let base;

const realFetch = globalThis.fetch;
// Fake Google tokeninfo responses by credential; every other request goes to the real fetch (the test client).
const googleTokens = new Map();
globalThis.fetch = (url, options) => {
    const text = String(url);
    if (text.startsWith('https://oauth2.googleapis.com/tokeninfo')) {
        const credential = decodeURIComponent(text.split('id_token=')[1]);
        const info = googleTokens.get(credential);
        return Promise.resolve({ ok: Boolean(info), json: async () => info });
    }
    return realFetch(url, options);
};

const call = async (method, path, { body, token } = {}) => {
    const res = await realFetch(base + path, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body ? JSON.stringify(body) : undefined
    });
    let json = null;
    try { json = await res.json(); } catch (e) { /* no body */ }
    return { status: res.status, json };
};

const register = async (name, email, password = 'Password-123') => {
    const r = await call('POST', '/api/auth/register', { body: { name, email, phone: '0300', password } });
    assert.equal(r.status, 201, JSON.stringify(r.json));
    return r.json.token;
};

test.before(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGO_URI = `${mongod.getUri()}leadcrm_test`;
    const app = require('../app');
    server = http.createServer(app).listen(0);
    base = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
    globalThis.fetch = realFetch;
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
});

test('health reports a connected database', async () => {
    const r = await call('GET', '/api/health');
    assert.equal(r.status, 200);
    assert.equal(r.json.database, 'connected');
});

test('registration validates input and rejects duplicates', async () => {
    assert.equal((await call('POST', '/api/auth/register', { body: { name: 'A', email: 'bad', phone: '1', password: 'Password-123' } })).status, 400);
    assert.equal((await call('POST', '/api/auth/register', { body: { name: 'A', email: 'a@example.test', phone: '1', password: 'short' } })).status, 400);
    assert.equal((await call('POST', '/api/auth/register', { body: { name: { $ne: null }, email: 'a@example.test', phone: '1', password: 'Password-123' } })).status, 400);

    await register('Dup User', 'dup@example.test');
    const again = await call('POST', '/api/auth/register', { body: { name: 'Dup', email: 'DUP@example.test', phone: '1', password: 'Password-123' } });
    assert.equal(again.status, 400);
    assert.match(again.json.message, /already exists/);
});

test('login succeeds with the right password and fails otherwise; no password or hash is ever returned', async () => {
    await register('Login User', 'login@example.test', 'Right-Password-1');
    const ok = await call('POST', '/api/auth/login', { body: { email: 'login@example.test', password: 'Right-Password-1' } });
    assert.equal(ok.status, 200);
    assert.ok(ok.json.token);
    assert.equal(JSON.stringify(ok.json).includes('password'), false);

    assert.equal((await call('POST', '/api/auth/login', { body: { email: 'login@example.test', password: 'nope-nope-1' } })).status, 401);
    assert.equal((await call('POST', '/api/auth/login', { body: { email: 'nobody@example.test', password: 'Right-Password-1' } })).status, 401);
    assert.equal((await call('POST', '/api/auth/login', { body: { email: { $ne: null }, password: { $ne: null } } })).status, 400);
});

test('protected routes reject missing and invalid tokens', async () => {
    assert.equal((await call('GET', '/api/leads')).status, 401);
    assert.equal((await call('GET', '/api/leads', { token: 'not.a.jwt' })).status, 401);
    assert.equal((await call('GET', '/api/auth/me')).status, 401);
});

test('lead CRUD works, normalises status, rejects bad input and persists', async () => {
    const token = await register('Lead Owner', 'owner@example.test');

    assert.equal((await call('POST', '/api/leads', { token, body: { name: 'X', email: 'nope' } })).status, 400);
    assert.equal((await call('POST', '/api/leads', { token, body: { name: 'X', email: 'x@example.test', status: 'bogus' } })).status, 400);

    const created = await call('POST', '/api/leads', { token, body: { name: 'Lead One', email: 'One@Example.test', phone: '1', status: 'new', assignedTo: 'sam' } });
    assert.equal(created.status, 201);
    assert.equal(created.json.data.status, 'New');
    assert.equal(created.json.data.email, 'one@example.test');
    const id = created.json.data._id;

    assert.equal((await call('POST', '/api/leads', { token, body: { name: 'Again', email: 'ONE@example.test' } })).status, 409);

    let list = await call('GET', '/api/leads', { token });
    assert.equal(list.json.count, 1);

    assert.equal((await call('PUT', `/api/leads/${id}`, { token, body: { status: 'nope' } })).status, 400);
    const updated = await call('PUT', `/api/leads/${id}`, { token, body: { status: 'converted' } });
    assert.equal(updated.json.data.status, 'Converted');

    list = await call('GET', '/api/leads', { token });
    assert.equal(list.json.data[0].status, 'Converted');

    assert.equal((await call('DELETE', `/api/leads/${id}`, { token })).status, 200);
    assert.equal((await call('GET', '/api/leads', { token })).json.count, 0);
    assert.equal((await call('DELETE', `/api/leads/${id}`, { token })).status, 404);
    assert.equal((await call('DELETE', '/api/leads/not-an-id', { token })).status, 404);
});

test("one user cannot read, update or delete another user's leads", async () => {
    const alice = await register('Alice', 'alice@example.test');
    const bob = await register('Bob', 'bob@example.test');

    const lead = await call('POST', '/api/leads', { token: alice, body: { name: 'Private Lead', email: 'private@example.test' } });
    const id = lead.json.data._id;

    assert.equal((await call('GET', '/api/leads', { token: bob })).json.count, 0);
    assert.equal((await call('PUT', `/api/leads/${id}`, { token: bob, body: { status: 'Contacted' } })).status, 404);
    assert.equal((await call('DELETE', `/api/leads/${id}`, { token: bob })).status, 404);

    // Both users may hold a lead with the same email: the duplicate rule is per owner.
    assert.equal((await call('POST', '/api/leads', { token: bob, body: { name: 'Mine', email: 'private@example.test' } })).status, 201);

    const still = await call('GET', '/api/leads', { token: alice });
    assert.equal(still.json.count, 1);
    assert.equal(still.json.data[0].status, 'New');
});

test('profile can be read and updated; invalid values are rejected', async () => {
    const token = await register('Profile User', 'profile@example.test');
    const me = await call('GET', '/api/auth/me', { token });
    assert.equal(me.status, 200);
    assert.equal(me.json.user.email, 'profile@example.test');

    assert.equal((await call('PUT', '/api/auth/me', { token, body: { name: '', phone: '1' } })).status, 400);
    assert.equal((await call('PUT', '/api/auth/me', { token, body: { name: 'New Name', phone: '0301', username: 'bad name!' } })).status, 400);

    const ok = await call('PUT', '/api/auth/me', { token, body: { name: 'New Name', phone: '0301', username: 'new.name' } });
    assert.equal(ok.status, 200);
    assert.equal(ok.json.user.name, 'New Name');
    assert.equal((await call('GET', '/api/auth/me', { token })).json.user.username, 'new.name');
});

test('password change needs the current password and takes effect', async () => {
    const token = await register('Pw User', 'pw@example.test', 'Old-Password-1');

    assert.equal((await call('PUT', '/api/auth/password', { token, body: { currentPassword: 'wrong-wrong', newPassword: 'New-Password-1' } })).status, 401);
    assert.equal((await call('PUT', '/api/auth/password', { token, body: { currentPassword: 'Old-Password-1', newPassword: 'short' } })).status, 400);
    assert.equal((await call('PUT', '/api/auth/password', { token, body: { currentPassword: 'Old-Password-1', newPassword: 'Old-Password-1' } })).status, 400);
    assert.equal((await call('PUT', '/api/auth/password', { token, body: { currentPassword: 'Old-Password-1', newPassword: 'New-Password-1' } })).status, 200);

    assert.equal((await call('POST', '/api/auth/login', { body: { email: 'pw@example.test', password: 'Old-Password-1' } })).status, 401);
    assert.equal((await call('POST', '/api/auth/login', { body: { email: 'pw@example.test', password: 'New-Password-1' } })).status, 200);
});

const googleInfo = (overrides = {}) => ({
    aud: process.env.GOOGLE_CLIENT_ID,
    iss: 'https://accounts.google.com',
    exp: String(Math.floor(Date.now() / 1000) + 3600),
    email_verified: 'true',
    sub: 'google-sub-1',
    email: 'guser@example.test',
    name: 'Google User',
    ...overrides
});

test('Google sign-in creates an account from a verified token and signs the same user in again', async () => {
    googleTokens.set('valid-credential-aaaaaaaaaaaa', googleInfo());
    const first = await call('POST', '/api/auth/google', { body: { credential: 'valid-credential-aaaaaaaaaaaa' } });
    assert.equal(first.status, 200, JSON.stringify(first.json));
    assert.equal(first.json.user.email, 'guser@example.test');
    assert.equal(first.json.user.googleLinked, true);

    const second = await call('POST', '/api/auth/google', { body: { credential: 'valid-credential-aaaaaaaaaaaa' } });
    assert.equal(second.json.user.id, first.json.user.id);

    // The Google-created account has no usable password.
    assert.equal((await call('POST', '/api/auth/login', { body: { email: 'guser@example.test', password: 'anything-123' } })).status, 401);
});

test('Google sign-in rejects forged, foreign, expired, unverified and malformed credentials', async () => {
    const cases = {
        'unknown-credential-bbbbbbbbbbbb': undefined,
        'wrong-aud-credential-cccccccccc': googleInfo({ aud: 'someone-elses-client-id' }),
        'wrong-iss-credential-dddddddddd': googleInfo({ iss: 'https://evil.example' }),
        'expired-credential-eeeeeeeeeeee': googleInfo({ exp: String(Math.floor(Date.now() / 1000) - 10) }),
        'unverified-credential-fffffffff': googleInfo({ email_verified: 'false' })
    };
    for (const [credential, info] of Object.entries(cases)) {
        if (info) googleTokens.set(credential, info);
        const r = await call('POST', '/api/auth/google', { body: { credential } });
        assert.equal(r.status, 401, `${credential} -> ${r.status}`);
    }
    assert.equal((await call('POST', '/api/auth/google', { body: {} })).status, 401);
    assert.equal((await call('POST', '/api/auth/google', { body: { credential: { $ne: null } } })).status, 401);
});

test('Google sign-in links to an existing password account with the same verified email', async () => {
    await register('Existing', 'existing@example.test');
    googleTokens.set('link-credential-gggggggggggg', googleInfo({ sub: 'google-sub-2', email: 'existing@example.test' }));
    const r = await call('POST', '/api/auth/google', { body: { credential: 'link-credential-gggggggggggg' } });
    assert.equal(r.status, 200);
    assert.equal(r.json.user.email, 'existing@example.test');
    // The original password still works after linking.
    assert.equal((await call('POST', '/api/auth/login', { body: { email: 'existing@example.test', password: 'Password-123' } })).status, 200);
});

test('unknown API routes return JSON 404 and no x-powered-by header', async () => {
    const r = await realFetch(`${base}/api/does-not-exist`, { headers: { Authorization: 'Bearer x' } });
    assert.equal(r.status, 404);
    assert.equal(r.headers.get('x-powered-by'), null);
});
