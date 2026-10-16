const mongoose = require('mongoose');
const { LEAD_STATUSES } = require('../leadValidation');

const leadSchema = new mongoose.Schema({
    // Every lead belongs to exactly one user; all queries are scoped by this field.
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    status: { type: String, enum: LEAD_STATUSES, default: 'New' },
    source: { type: String, default: 'Website' },
    assignedTo: { type: String, default: '' },
    notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);
