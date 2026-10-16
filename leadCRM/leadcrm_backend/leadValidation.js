// Pure validation/normalisation helpers for lead input (no database access, so they are unit-testable).

const LEAD_STATUSES = ['New', 'Contacted', 'Converted'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LIMITS = { name: 100, email: 254, phone: 30, source: 60, assignedTo: 100, notes: 2000 };

// Only plain strings are accepted from the request body (blocks operator objects like { "$ne": null }).
const asString = (value) => (typeof value === 'string' ? value.trim() : '');

// Accepts any casing ("new", "NEW") and returns the canonical status, or null when it is not a known status.
const normalizeStatus = (value) => {
    const wanted = asString(value).toLowerCase();
    return LEAD_STATUSES.find((status) => status.toLowerCase() === wanted) || null;
};

// Returns { error } for invalid input, otherwise { value } with trimmed, canonical fields.
const parseLeadInput = (body) => {
    const input = body || {};
    const name = asString(input.name);
    const email = asString(input.email).toLowerCase();
    if (!name || !email) return { error: 'Name and email are required' };
    if (!EMAIL_PATTERN.test(email)) return { error: 'Please enter a valid email address' };

    const status = input.status === undefined || input.status === '' ? 'New' : normalizeStatus(input.status);
    if (!status) return { error: `Status must be one of: ${LEAD_STATUSES.join(', ')}` };

    const value = {
        name,
        email,
        phone: asString(input.phone),
        status,
        source: asString(input.source) || 'Website',
        assignedTo: asString(input.assignedTo),
        notes: asString(input.notes)
    };

    const tooLong = Object.keys(LIMITS).find((field) => value[field].length > LIMITS[field]);
    if (tooLong) return { error: `${tooLong} is too long (maximum ${LIMITS[tooLong]} characters)` };

    return { value };
};

module.exports = { LEAD_STATUSES, asString, normalizeStatus, parseLeadInput };
