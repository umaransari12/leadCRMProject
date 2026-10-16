const test = require('node:test');
const assert = require('node:assert/strict');
const { LEAD_STATUSES, normalizeStatus, parseLeadInput } = require('../leadValidation');

test('normalizeStatus accepts any casing and returns the canonical value', () => {
    assert.equal(normalizeStatus('new'), 'New');
    assert.equal(normalizeStatus(' CONTACTED '), 'Contacted');
    assert.equal(normalizeStatus('Converted'), 'Converted');
});

test('normalizeStatus rejects unknown and non-string values', () => {
    assert.equal(normalizeStatus('won'), null);
    assert.equal(normalizeStatus(''), null);
    assert.equal(normalizeStatus(undefined), null);
    assert.equal(normalizeStatus({ $ne: null }), null);
    assert.equal(normalizeStatus(['New']), null);
});

test('parseLeadInput trims, lower-cases the email and applies defaults', () => {
    const { value, error } = parseLeadInput({ name: '  Ada  ', email: ' Ada@Example.COM ' });
    assert.equal(error, undefined);
    assert.deepEqual(value, {
        name: 'Ada',
        email: 'ada@example.com',
        phone: '',
        status: 'New',
        source: 'Website',
        assignedTo: '',
        notes: ''
    });
});

test('parseLeadInput canonicalises a lowercase status from the form', () => {
    const { value } = parseLeadInput({ name: 'A', email: 'a@b.co', status: 'contacted' });
    assert.equal(value.status, 'Contacted');
});

test('parseLeadInput requires name and email', () => {
    assert.match(parseLeadInput({}).error, /required/);
    assert.match(parseLeadInput({ name: 'A' }).error, /required/);
    assert.match(parseLeadInput({ email: 'a@b.co' }).error, /required/);
    assert.match(parseLeadInput(undefined).error, /required/);
});

test('parseLeadInput rejects invalid emails and statuses', () => {
    assert.match(parseLeadInput({ name: 'A', email: 'not-an-email' }).error, /valid email/);
    assert.match(parseLeadInput({ name: 'A', email: 'a@b.co', status: 'bogus' }).error, /Status must be one of/);
});

test('parseLeadInput ignores operator objects and non-string values', () => {
    assert.match(parseLeadInput({ name: { $ne: null }, email: 'a@b.co' }).error, /required/);
    const { value } = parseLeadInput({ name: 'A', email: 'a@b.co', phone: 12345, notes: { x: 1 } });
    assert.equal(value.phone, '');
    assert.equal(value.notes, '');
});

test('parseLeadInput enforces field length limits', () => {
    assert.match(parseLeadInput({ name: 'x'.repeat(101), email: 'a@b.co' }).error, /name is too long/);
    assert.match(parseLeadInput({ name: 'A', email: 'a@b.co', notes: 'n'.repeat(2001) }).error, /notes is too long/);
});

test('LEAD_STATUSES lists the three supported statuses', () => {
    assert.deepEqual(LEAD_STATUSES, ['New', 'Contacted', 'Converted']);
});
