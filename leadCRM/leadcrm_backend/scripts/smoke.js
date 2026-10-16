// End-to-end smoke test against a running deployment. Creates two disposable users and dummy leads, checks that users
// cannot see each other's data, then removes the leads it created. Usage:
//   BASE_URL=https://your-app.vercel.app node scripts/smoke.js      (defaults to http://localhost:5000)
// Prints PASS/FAIL per step and never prints tokens or passwords. The two throwaway user accounts remain in the
// database (there is no delete-account endpoint); remove them from Atlas if you like.
const BASE_URL = (process.env.BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
const stamp = Date.now();
const rand = () => Math.random().toString(36).slice(2, 10);
const userA = { email: `smoke.a.${stamp}@example.test`, password: `Smoke-${stamp}-${rand()}` };
const userB = { email: `smoke.b.${stamp}@example.test`, password: `Smoke-${stamp}-${rand()}` };

let failures = 0;

const call = async (method, path, body, token) => {
    const res = await fetch(BASE_URL + path, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
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

    let r = await call('GET', '/api/health');
    check('health reports database connected', r.status === 200 && r.json && r.json.database === 'connected', `${r.status} ${JSON.stringify(r.json)}`);

    r = await call('GET', '/api/leads');
    check('leads without token -> 401', r.status === 401, r.status);
    r = await call('GET', '/api/auth/me');
    check('profile without token -> 401', r.status === 401, r.status);

    r = await call('POST', '/api/auth/register', { name: 'Smoke A', email: 'bad', phone: '1', password: userA.password });
    check('register with invalid email -> 400', r.status === 400, r.status);

    r = await call('POST', '/api/auth/register', { name: 'Smoke A', email: userA.email, phone: '0000000000', username: `smokea${stamp}`, password: userA.password });
    check('register user A -> 201 with token', r.status === 201 && r.json && !!r.json.token, r.status);
    let tokenA = (r.json && r.json.token) || '';

    r = await call('POST', '/api/auth/register', { name: 'Smoke A', email: userA.email, phone: '0000000000', password: userA.password });
    check('duplicate registration -> 400', r.status === 400, r.status);

    r = await call('POST', '/api/auth/login', { email: userA.email, password: 'wrong-password' });
    check('login with wrong password -> 401', r.status === 401, r.status);

    r = await call('POST', '/api/auth/login', { email: userA.email, password: userA.password });
    check('login -> 200 with token', r.status === 200 && r.json && !!r.json.token, r.status);
    tokenA = (r.json && r.json.token) || tokenA;

    r = await call('GET', '/api/auth/me', null, tokenA);
    check('profile returns the signed-in user', r.status === 200 && r.json && r.json.user.email === userA.email, r.status);

    r = await call('PUT', '/api/auth/me', { name: 'Smoke A Renamed', phone: '0111', username: `smokea${stamp}` }, tokenA);
    check('profile update -> 200', r.status === 200 && r.json && r.json.user.name === 'Smoke A Renamed', r.status);

    const newPassword = `Changed-${stamp}-${rand()}`;
    r = await call('PUT', '/api/auth/password', { currentPassword: 'not-the-password', newPassword }, tokenA);
    check('password change with wrong current password -> 401', r.status === 401, r.status);
    r = await call('PUT', '/api/auth/password', { currentPassword: userA.password, newPassword }, tokenA);
    check('password change -> 200', r.status === 200, r.status);
    r = await call('POST', '/api/auth/login', { email: userA.email, password: newPassword });
    check('login with the new password -> 200', r.status === 200, r.status);
    r = await call('POST', '/api/auth/login', { email: userA.email, password: userA.password });
    check('login with the old password -> 401', r.status === 401, r.status);

    r = await call('POST', '/api/auth/google', { credential: 'not-a-real-google-token-at-all' });
    check('Google sign-in rejects a bogus credential (401, or 503 while unconfigured)', r.status === 401 || r.status === 503, r.status);

    // Leads
    r = await call('POST', '/api/leads', { name: 'Dummy Lead', email: 'x' }, tokenA);
    check('create lead with invalid email -> 400', r.status === 400, r.status);

    r = await call('POST', '/api/leads', { name: 'Dummy Lead', email: `Lead.${stamp}@Example.test`, phone: '111', status: 'new', assignedTo: 'tester', notes: 'smoke' }, tokenA);
    check('create lead (lowercase status) -> 201, status canonical "New"', r.status === 201 && r.json && r.json.data && r.json.data.status === 'New', `${r.status} ${JSON.stringify(r.json)}`);
    const leadId = r.json && r.json.data && r.json.data._id;

    r = await call('POST', '/api/leads', { name: 'Dummy Again', email: `lead.${stamp}@example.test` }, tokenA);
    check('duplicate lead email -> 409', r.status === 409, r.status);

    r = await call('GET', '/api/leads', null, tokenA);
    check('list leads contains the new lead', r.status === 200 && r.json && r.json.data.some((l) => l._id === leadId), r.status);

    // Isolation between users
    r = await call('POST', '/api/auth/register', { name: 'Smoke B', email: userB.email, phone: '0000000001', password: userB.password });
    const tokenB = (r.json && r.json.token) || '';
    check('register user B -> 201', r.status === 201 && !!tokenB, r.status);

    r = await call('GET', '/api/leads', null, tokenB);
    check("user B cannot see user A's leads", r.status === 200 && r.json && !r.json.data.some((l) => l._id === leadId), r.status);
    r = await call('PUT', `/api/leads/${leadId}`, { status: 'Converted' }, tokenB);
    check("user B cannot update user A's lead -> 404", r.status === 404, r.status);
    r = await call('DELETE', `/api/leads/${leadId}`, null, tokenB);
    check("user B cannot delete user A's lead -> 404", r.status === 404, r.status);

    r = await call('PUT', `/api/leads/${leadId}`, { status: 'bogus' }, tokenA);
    check('update lead with invalid status -> 400', r.status === 400, r.status);
    r = await call('PUT', `/api/leads/${leadId}`, { status: 'contacted' }, tokenA);
    check('update lead status -> 200 "Contacted"', r.status === 200 && r.json && r.json.data.status === 'Contacted', r.status);

    r = await call('GET', '/api/leads', null, tokenA);
    const found = r.json && r.json.data && r.json.data.find((l) => l._id === leadId);
    check('status change persisted and the lead is still there', !!found && found.status === 'Contacted', JSON.stringify(found));

    r = await call('DELETE', `/api/leads/${leadId}`, null, tokenA);
    check('owner can delete the lead -> 200', r.status === 200, r.status);
    r = await call('GET', '/api/leads', null, tokenA);
    check('deleted lead is gone', r.status === 200 && r.json && !r.json.data.some((l) => l._id === leadId), r.status);

    console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
    console.log(`(Disposable test users ${userA.email} and ${userB.email} remain in the database; remove them from Atlas if desired.)`);
    process.exit(failures === 0 ? 0 : 1);
})().catch((err) => {
    console.error('Smoke test crashed:', err.message);
    process.exit(1);
});
