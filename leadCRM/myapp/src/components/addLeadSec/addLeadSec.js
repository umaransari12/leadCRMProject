import React, { useState } from 'react';
import "./addLeadSec.scss";
import { X } from "@phosphor-icons/react";
import api from '../../api';

// onClose is optional: on the /addlead page the parent navigates away instead of closing a modal.
const AddLeadSec = ({ onClose, onLeadAdded }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        source: 'Website',
        status: 'New',
        assignedTo: '',
        notes: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        let created = false;
        try {
            const response = await api.post('/api/leads', formData);
            created = Boolean(response.data && response.data.success);
            if (!created) setError('The server did not confirm the lead was saved. Please try again.');
        } catch (err) {
            setError(
                err.response
                    ? err.response.data?.message || 'The server could not add the lead. Please try again.'
                    : 'Could not reach the server. Check your connection and try again.'
            );
        } finally {
            setLoading(false);
        }

        // Runs outside the request try/catch so a problem in a callback is never reported as a failed save.
        if (created) {
            if (onLeadAdded) onLeadAdded();
            if (onClose) onClose();
        }
    };

    return (
        <div className="add_lead_modal_overlay">
            <div className="add_lead_modal_content">

                <div className="modal_header">
                    <div className="text_side">
                        <h3 className="heading_h3 heading">Add New Lead</h3>
                    </div>
                    {onClose && (
                        <button type="button" className="close_btn" onClick={onClose} aria-label="Close">
                            <X size={20} weight="bold" />
                        </button>
                    )}
                </div>

                {error && <div className="error_msg" role="alert">{error}</div>}

                <form className="modal_form" onSubmit={handleSubmit}>
                    <div className="input_row">
                        <div className="input_group">
                            <label className="heading_l text" htmlFor="lead_name">Full Name</label>
                            <input
                                id="lead_name"
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter full name"
                                maxLength={100}
                                required
                            />
                        </div>
                    </div>

                    <div className="input_row">
                        <div className="input_group">
                            <label className="heading_l text" htmlFor="lead_email">Email Address</label>
                            <input
                                id="lead_email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter email address"
                                maxLength={254}
                                required
                            />
                        </div>
                    </div>

                    <div className="input_row">
                        <div className="input_group">
                            <label className="heading_l text" htmlFor="lead_phone">Phone Number</label>
                            <input
                                id="lead_phone"
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Enter phone number"
                                maxLength={30}
                                required
                            />
                        </div>
                    </div>

                    <div className="input_row">
                        <div className="input_group">
                            <label className="heading_l text" htmlFor="lead_assigned">Assigned To</label>
                            <input
                                id="lead_assigned"
                                type="text"
                                name="assignedTo"
                                value={formData.assignedTo}
                                onChange={handleChange}
                                placeholder="Enter assignee name"
                                maxLength={100}
                                required
                            />
                        </div>
                    </div>

                    <div className="input_row">
                        <div className="input_group">
                            <label className="heading_l text" htmlFor="lead_status">Status</label>
                            <select id="lead_status" className='status' name="status" value={formData.status} onChange={handleChange}>
                                <option value="New">New</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Converted">Converted</option>
                            </select>
                        </div>
                    </div>

                    <div className="input_row">
                        <div className="input_group">
                            <label className="heading_l text" htmlFor="lead_notes">Notes (Optional)</label>
                            <textarea
                                id="lead_notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Add any notes..."
                                maxLength={2000}
                            />
                        </div>
                    </div>

                    <div className='action_otr'>
                        {onClose && (
                            <button type="button" className="cancel_btn" onClick={onClose} disabled={loading}>Cancel</button>
                        )}
                        <button type="submit" className="primary_btn save_btn" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Lead'}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};

export default AddLeadSec;
