const mongoose = require('mongoose');
const Lead = require('../models/lead');

// Only plain strings are accepted from the request body (blocks operator objects like { "$ne": null }).
const asString = (value) => (typeof value === 'string' ? value.trim() : '');

const getLeads = async (req, res) => {
    try {
        const leads = await Lead.find({ owner: req.user._id }).sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            count: leads.length,
            data: leads
        });
    } catch (error) {
        console.error("Leads fetch karne mein error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const createLead = async (req, res) => {
    try {
        const body = req.body || {};
        const name = asString(body.name);
        const email = asString(body.email);
        if (!name || !email) {
            return res.status(400).json({ success: false, message: "Name and email are required" });
        }

        const newLead = new Lead({
            owner: req.user._id,
            name,
            email,
            phone: asString(body.phone),
            status: asString(body.status) || 'New',
            source: asString(body.source) || 'Website',
            assignedTo: asString(body.assignedTo),
            notes: asString(body.notes)
        });

        await newLead.save();

        return res.status(201).json({
            success: true,
            message: "Lead added successfully!",
            data: newLead
        });
    } catch (error) {
        console.error("Lead create karne mein error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const updateLeadStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const status = asString((req.body || {}).status);
        if (!mongoose.isValidObjectId(id)) {
            return res.status(404).json({ success: false, message: "Lead not found" });
        }
        if (!status) {
            return res.status(400).json({ success: false, message: "Status is required" });
        }

        // Scoped to the logged-in user: someone else's lead id behaves exactly like a missing lead.
        const updatedLead = await Lead.findOneAndUpdate(
            { _id: id, owner: req.user._id },
            { status },
            { new: true, runValidators: true }
        );

        if (!updatedLead) {
            return res.status(404).json({ success: false, message: "Lead not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Status updated successfully!",
            data: updatedLead
        });
    } catch (error) {
        console.error("Status update karne mein error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const deleteLead = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(404).json({ success: false, message: "Lead not found" });
        }

        const deletedLead = await Lead.findOneAndDelete({ _id: id, owner: req.user._id });

        if (!deletedLead) {
            return res.status(404).json({ success: false, message: "Lead not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Lead deleted successfully!"
        });
    } catch (error) {
        console.error("Lead delete karne mein error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports = {
    getLeads,
    createLead,
    updateLeadStatus,
    deleteLead
};
