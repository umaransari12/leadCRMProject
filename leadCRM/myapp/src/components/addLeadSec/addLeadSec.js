import React, { useState } from 'react';
import "./addLeadSec.scss";
import { X } from "@phosphor-icons/react";
import api from '../../api';

const AddLeadSec = ({ onClose, onLeadAdded }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        source: 'Website', 
        status: 'new',      
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

        try {
            const response = await api.post('/api/leads', formData);
            
            if (response.data.success) {
                alert('Lead added successfully!'); 
                if (onLeadAdded) onLeadAdded();    
                onClose();                         
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Server error: Failed to add lead');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add_lead_modal_overlay">
            <div className="add_lead_modal_content">
                
                <div className="modal_header">
                    <div className="text_side">
                        <h3 className="heading_h3 heading">Add New Lead</h3>
                    </div>
                    <button className="close_btn" onClick={onClose}>
                        <X size={20} weight="bold" />
                    </button>
                </div>

                {error && <div className="error_msg">{error}</div>}

                <form className="modal_form" onSubmit={handleSubmit}>
                    <div className="input_row">
                        <div className="input_group">
                            <label className="heading_l text">Full Name</label>
                            <input 
                                type="text" 
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter full name" 
                                required
                            />
                        </div>
                    </div>

                    <div className="input_row">
                        <div className="input_group">
                            <label className="heading_l text">Email Address</label>
                            <input 
                                type="email" 
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter email address" 
                                required
                            />
                        </div>
                    </div>

                    <div className="input_row">
                        <div className="input_group">
                            <label className="heading_l text">Phone Number</label>
                            <input 
                                type="text" 
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Enter phone number" 
                                required
                            />
                        </div>
                    </div>

                    <div className="input_row">
                        <div className="input_group">
                            <label className="heading_l text">Assigned To</label>
                            <input 
                                type="text" 
                                name="assignedTo"
                                value={formData.assignedTo}
                                onChange={handleChange}
                                placeholder="Enter assignee name" 
                                required
                            />
                        </div>
                    </div>

                    <div className="input_row">
                        <div className="input_group">
                            <label className="heading_l text">Status</label>
                            <select className='status' name="status" value={formData.status} onChange={handleChange}>
                                <option value="new">New</option>
                                <option value="contacted">Contacted</option>
                                <option value="converted">Converted</option>
                            </select>
                        </div>
                    </div>

                    <div className="input_row">
                        <div className="input_group">
                            <label className="heading_l text">Notes (Optional)</label>
                            <textarea 
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Add any notes..."
                            />
                        </div>
                    </div>

                    <div className='action_otr'>
                        <button type="button" className="cancel_btn" onClick={onClose} disabled={loading}>Cancel</button>
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