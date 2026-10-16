const test = require('node:test');
const assert = require('node:assert/strict');
const { verifyGoogleIdToken, GoogleAuthError } = require('../googleAuth');
const { createRateLimiter } = require('../rateLimit');

const CLIENT_ID = 'client-123.apps.googleusercontent.com';
const goodInfo = () => ({
    aud: CLIENT_ID,
    iss: 'accounts.google.com',
    exp: String(Math.floor(Date.now() / 1000) + 600),
    email_verified: 'true',
    sub: '42',
    email: 'Person@Example.test',
    name: 'Person'
});
const fakeFetch = (info, ok = true) => async () => ({ ok, json: async () => info });
const token = 'x'.repeat(40);

test('verifyGoogleIdToken accepts a valid token and normalises the email', async () => {
    const user = await verifyGoogleIdToken(token, { clientId: CLIENT_ID, fetchImpl: fakeFetch(goodInfo()) });
    assert.deepEqual(user, { googleId: '42', email: 'person@example.test', name: 'Person' });
});

test('verifyGoogleIdToken fails closed when no client ID is configured', async () => {
    await assert.rejects(
        verifyGoogleIdToken(token, { clientId: '', fetchImpl: fakeFetch(goodInfo()) }),
        (error) => error instanceof GoogleAuthError && error.status === 503
    );
});

test('verifyGoogleIdToken rejects wrong audience, expired, unverified and malformed tokens', async () => {
    const bad = [
        { ...goodInfo(), aud: 'other-client' },
        { ...goodInfo(), exp: String(Math.floor(Date.now() / 1000) - 5) },
        { ...goodInfo(), email_verified: 'false' },
        { ...goodInfo(), iss: 'evil.example' },
        { ...goodInfo(), sub: undefined }
    ];
    for (const info of bad) {
        await assert.rejects(verifyGoogleIdToken(token, { clientId: CLIENT_ID, fetchImpl: fakeFetch(info) }), GoogleAuthError);
    }
    await assert.rejects(verifyGoogleIdToken('short', { clientId: CLIENT_ID, fetchImpl: fakeFetch(goodInfo()) }), GoogleAuthError);
    await assert.rejects(verifyGoogleIdToken(undefined, { clientId: CLIENT_ID, fetchImpl: fakeFetch(goodInfo()) }), GoogleAuthError);
    await assert.rejects(verifyGoogleIdToken(token, { clientId: CLIENT_ID, fetchImpl: fakeFetch({}, false) }), GoogleAuthError);
});

test('verifyGoogleIdToken reports a Google outage as 502, not as a bad credential', async () => {
    const failing = async () => { throw new Error('network down'); };
    await assert.rejects(
        verifyGoogleIdToken(token, { clientId: CLIENT_ID, fetchImpl: failing }),
        (error) => error.status === 502
    );
});

test('rate limiter allows up to max requests per window, then answers 429 with Retry-After, then recovers', () => {
    let time = 0;
    const limiter = createRateLimiter({ windowMs: 1000, max: 2, now: () => time });
    const run = () => {
        const out = { calledNext: false, headers: {}, status: 200 };
        const res = {
            set: (k, v) => { out.headers[k] = v; },
            status: (s) => { out.status = s; return { json: () => out }; }
        };
        limiter({ ip: '1.2.3.4' }, res, () => { out.calledNext = true; });
        return out;
    };
    assert.equal(run().calledNext, true);
    assert.equal(run().calledNext, true);
    const blocked = run();
    assert.equal(blocked.status, 429);
    assert.ok(blocked.headers['Retry-After']);
    time = 1500;
    assert.equal(run().calledNext, true);
});
