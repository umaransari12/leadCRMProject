const Lead = require('../models/lead');


const getLeads = async (req, res) => {
    try {
        const leads = await Lead.find({}).sort({ createdAt: -1 }); 
        return res.status(200).json({
            success: true,
            count: leads.length,
            data: leads
        });
    } catch (error) {
        console.error("Leads fetch karne mein error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};


const createLead = async (req, res) => {
    try {
      
        const { name, email, phone, status, source, assignedTo, notes } = req.body;
        
        const newLead = new Lead({
            name,
            email,
            phone,
            status: status || 'New',
            source: source || 'Website',
            assignedTo: assignedTo || '',
            notes: notes || ''
        });

        await newLead.save();

        return res.status(201).json({
            success: true,
            message: "Lead added successfully!",
            data: newLead
        });
    } catch (error) {
        console.error("Lead create karne mein error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};


const updateLeadStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updatedLead = await Lead.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        if (!updatedLead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Status updated successfully!",
            data: updatedLead
        });
    } catch (error) {
        console.error("Status update karne mein error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

const deleteLead = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedLead = await Lead.findByIdAndDelete(id);

        if (!deletedLead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Lead deleted successfully!"
        });
    } catch (error) {
        console.error("Lead delete karne mein error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

module.exports = {
    getLeads,
    createLead,
    updateLeadStatus,
    deleteLead
};