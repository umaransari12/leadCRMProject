const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    // Every lead belongs to exactly one user; all queries are scoped by this field.
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    status: { type: String, default: 'New' },
    source: { type: String, default: 'Website' },
    assignedTo: { type: String, default: '' }, // Yeh ab handle karega 'umar' ko
    notes: { type: String, default: '' }        // Yeh handle karega extra notes ko
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);
