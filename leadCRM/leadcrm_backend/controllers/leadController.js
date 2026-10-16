const mongoose = require('mongoose');
const Lead = require('../models/lead');
const { asString, normalizeStatus, parseLeadInput } = require('../leadValidation');

const getLeads = async (req, res) => {
    try {
        const leads = await Lead.find({ owner: req.user._id }).sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            count: leads.length,
            data: leads
        });
    } catch (error) {
        console.error('Leads fetch error:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const createLead = async (req, res) => {
    try {
        const { error, value } = parseLeadInput(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error });
        }

        // A user cannot have two leads with the same email (case-insensitive: emails are stored lower-cased).
        // Collation makes the match case-insensitive for older leads that were saved with mixed-case emails.
        const duplicate = await Lead.exists({ owner: req.user._id, email: value.email }).collation({ locale: 'en', strength: 2 });
        if (duplicate) {
            return res.status(409).json({ success: false, message: 'A lead with this email already exists' });
        }

        const newLead = new Lead({ owner: req.user._id, ...value });
        await newLead.save();

        return res.status(201).json({
            success: true,
            message: 'Lead added successfully!',
            data: newLead
        });
    } catch (error) {
        if (error && error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: 'Invalid lead data' });
        }
        console.error('Lead create error:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const updateLeadStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }
        const rawStatus = asString((req.body || {}).status);
        if (!rawStatus) {
            return res.status(400).json({ success: false, message: 'Status is required' });
        }
        const status = normalizeStatus(rawStatus);
        if (!status) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        // Scoped to the logged-in user: someone else's lead id behaves exactly like a missing lead.
        const updatedLead = await Lead.findOneAndUpdate(
            { _id: id, owner: req.user._id },
            { status },
            { new: true, runValidators: true }
        );

        if (!updatedLead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        return res.status(200).json({
            success: true,
            message: 'Status updated successfully!',
            data: updatedLead
        });
    } catch (error) {
        console.error('Status update error:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const deleteLead = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        const deletedLead = await Lead.findOneAndDelete({ _id: id, owner: req.user._id });

        if (!deletedLead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        return res.status(200).json({
            success: true,
            message: 'Lead deleted successfully!'
        });
    } catch (error) {
        console.error('Lead delete error:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

module.exports = {
    getLeads,
    createLead,
    updateLeadStatus,
    deleteLead
};
