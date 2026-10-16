// End-to-end smoke test against a running deployment. Creates a disposable user and dummy leads, then removes the
// leads it created. Usage:  BASE_URL=https://your-app.vercel.app node scripts/smoke.js
// (defaults to http://localhost:5000). Prints PASS/FAIL per step and never prints tokens or passwords.
const BASE_URL = (process.env.BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
const stamp = Date.now();
const email = `smoke.${stamp}@example.test`;
const password = `Smoke-${stamp}-${Math.random().toString(36).slice(2, 10)}`;

let failures = 0;
let token = '';

const call = async (method, path, body, auth = true) => {
    const res = await fetch(BASE_URL + path, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(auth && token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: body ? JSON.stringify(body) : undefined
    });
    let json = null;
    try { json = await res.json(); } catch (e) { /* non-JSON response */ }
    return { status: res.status, json };
};

const check = (name, ok, detail = '') => {
    if (!ok) failures += 1;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  -> ${detail}`}`);
};

(async () => {
    console.log(`Smoke test against ${BASE_URL}`);

    let r = await call('GET', '/api/health', null, false);
    check('health reports database connected', r.status === 200 && r.json && r.json.database === 'connected', `${r.status} ${JSON.stringify(r.json)}`);

    r = await call('GET', '/api/leads', null, false);
    check('leads without token -> 401', r.status === 401, r.status);

    r = await call('POST', '/api/auth/register', { name: 'Smoke Test', email: 'bad', phone: '1', password }, false);
    check('register with invalid email -> 400', r.status === 400, r.status);

    r = await call('POST', '/api/auth/register', { name: 'Smoke Test', email, phone: '0000000000', username: `smoke${stamp}`, password }, false);
    check('register -> 201 with token', r.status === 201 && r.json && !!r.json.token, r.status);
    token = (r.json && r.json.token) || '';

    r = await call('POST', '/api/auth/login', { email, password: 'wrong-password' }, false);
    check('login with wrong password -> 401', r.status === 401, r.status);

    r = await call('POST', '/api/auth/login', { email, password }, false);
    check('login -> 200 with token', r.status === 200 && r.json && !!r.json.token, r.status);
    token = (r.json && r.json.token) || token;

    r = await call('POST', '/api/leads', { name: 'Dummy Lead', email: 'x' });
    check('create lead with invalid email -> 400', r.status === 400, r.status);

    r = await call('POST', '/api/leads', { name: 'Dummy Lead', email: `Lead.${stamp}@Example.test`, phone: '111', status: 'new', assignedTo: 'tester', notes: 'smoke' });
    check('create lead (lowercase status) -> 201, status canonical "New"', r.status === 201 && r.json && r.json.data && r.json.data.status === 'New', `${r.status} ${JSON.stringify(r.json)}`);
    const leadId = r.json && r.json.data && r.json.data._id;

    r = await call('POST', '/api/leads', { name: 'Dummy Again', email: `lead.${stamp}@example.test` });
    check('duplicate lead email -> 409', r.status === 409, r.status);

    r = await call('GET', '/api/leads');
    check('list leads contains the new lead', r.status === 200 && r.json && r.json.data.some((l) => l._id === leadId), r.status);

    r = await call('PUT', `/api/leads/${leadId}`, { status: 'bogus' });
    check('update lead with invalid status -> 400', r.status === 400, r.status);

    r = await call('PUT', `/api/leads/${leadId}`, { status: 'contacted' });
    check('update lead status -> 200 "Contacted"', r.status === 200 && r.json && r.json.data.status === 'Contacted', r.status);

    r = await call('GET', '/api/leads');
    const found = r.json && r.json.data && r.json.data.find((l) => l._id === leadId);
    check('status change persisted', !!found && found.status === 'Contacted', JSON.stringify(found));

    r = await call('DELETE', `/api/leads/${leadId}`);
    check('delete lead -> 200', r.status === 200, r.status);

    r = await call('GET', '/api/leads');
    check('deleted lead is gone', r.status === 200 && r.json && !r.json.data.some((l) => l._id === leadId), r.status);

    console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
    console.log(`(Disposable test user ${email} remains in the database; remove it from Atlas if desired.)`);
    process.exit(failures === 0 ? 0 : 1);
})().catch((err) => {
    console.error('Smoke test crashed:', err.message);
    process.exit(1);
});
