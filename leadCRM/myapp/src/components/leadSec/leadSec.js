import React, { useState, useEffect, useRef } from 'react'; 
import { Link } from "react-router-dom";
import { MagnifyingGlassIcon, CaretDownIcon, PlusIcon } from "@phosphor-icons/react";
import "./leadSec.scss";
import AddLeadSec from "../addLeadSec/addLeadSec"; 
import axios from 'axios'; 

const LeadSec = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [leads, setLeads] = useState([]); 
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const leadsPerPage = 5; 

    const [activeActionId, setActiveActionId] = useState(null); 

    const statusDropdownRef = useRef(null);
    const actionsMenuRef = useRef(null);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
    };

    const fetchLeads = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/leads', getAuthHeaders());
            
            console.log("Backend Response Raw Data:", response.data);

            if (response.data) {
                if (Array.isArray(response.data)) {
                    setLeads(response.data);
                } else if (response.data.data && Array.isArray(response.data.data)) {
                    setLeads(response.data.data);
                } else if (response.data.leads && Array.isArray(response.data.leads)) {
                    setLeads(response.data.leads);
                } else {
                    setLeads([]);
                }
            } else {
                setLeads([]);
            }
        } catch (error) {
            console.error("Database se data lane mein masla aya:", error);
            setLeads([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedStatus]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
                setIsStatusDropdownOpen(false);
            }
            if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target)) {
                setActiveActionId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            const response = await axios.put(
                `http://localhost:5000/api/leads/${id}`, 
                { status: newStatus },
                getAuthHeaders()
            );
            if (response.data.success) {
                alert('Lead status updated successfully!');
                setActiveActionId(null);
                fetchLeads();
            }
        } catch (error) {
            alert('Failed to update status');
            console.error(error);
        }
    };

    const handleDeleteLead = async (id) => {
        if (window.confirm('Are you sure you want to delete this lead?')) {
            try {
                const response = await axios.delete(`http://localhost:5000/api/leads/${id}`, getAuthHeaders());
                if (response.data.success) {
                    alert('Lead deleted successfully!');
                    setActiveActionId(null);
                    fetchLeads();
                }
            } catch (error) {
                alert('Failed to delete lead');
                console.error(error);
            }
        }
    };

    const filteredLeads = leads.filter((lead) => {
        if (!lead) return false;
        const matchesSearch = 
            (lead.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (lead.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (lead.phone?.includes(searchQuery));

        const matchesStatus = selectedStatus === 'All' || lead.status?.toLowerCase() === selectedStatus.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    const indexOfLastLead = currentPage * leadsPerPage;
    const indexOfFirstLead = indexOfLastLead - leadsPerPage;
    const currentLeads = filteredLeads.slice(indexOfFirstLead, indexOfLastLead);
    const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);

    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    return (
        <div className="lead_sec">
            <div className="container">
                <div className="lead_inr">
                    <div className="lead_top">
                        <h2 className="heading_h2 heading">Leads</h2>
                        <p className="heading_l desc">Manage and track your leads</p>
                    </div>

                    <div className="lead_searchbar_otr">
                        <div className="status_searchbar_otr">
                            <div className="searchbar_otr">
                                <Link to="#" className='link'>
                                    <MagnifyingGlassIcon size={16} className='icon' />
                                </Link>
                                <input 
                                    type="text" 
                                    placeholder="Search by name, email or phone.." 
                                    className='input' 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div 
                                ref={statusDropdownRef}
                                className="status_otr" 
                                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                            >
                                <p className="heading_l text">
                                    {selectedStatus === 'All' ? 'All Status' : selectedStatus}
                                </p>
                                <div className='link'>
                                    <CaretDownIcon size={22} className='icon' />
                                </div>

                                {isStatusDropdownOpen && (
                                    <div className="status_dropdown_menu">
                                        {['All', 'New', 'Contacted', 'Converted'].map((statusOption) => (
                                            <div 
                                                key={statusOption}
                                                className="status_dropdown_item"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedStatus(statusOption);
                                                    setIsStatusDropdownOpen(false);
                                                }}
                                            >
                                                {statusOption === 'All' ? 'All Status' : statusOption}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="action_otr">
                            <button 
                                className='primary_btn btn' 
                                onClick={() => setIsModalOpen(true)}
                            >
                                <PlusIcon size={22} className="icon" />
                                Add Lead
                            </button>
                        </div>
                    </div>

                    <div className="table-otr">
                        <table className="leads-table">
                            <thead className='table_head'>
                                <tr>
                                    <th className='heading_l heading'>#</th>
                                    <th className='heading_l heading'>Name</th>
                                    <th className='heading_l heading'>Email</th>
                                    <th className='heading_l heading'>Phone</th>
                                    <th className='heading_l heading'>Status</th>
                                    <th className='heading_l heading'>Source</th>
                                    <th className='heading_l heading'>Created At</th>
                                    <th className='heading_l heading'>Actions</th>
                                </tr>
                            </thead>
                            <tbody className='table_body'>
                                {loading ? (
                                    <tr>
                                        <td colSpan="8" className='heading_l data load_text'>
                                            Loading leads...
                                        </td>
                                    </tr>
                                ) : currentLeads.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className='heading_l data empty_text'>
                                            No leads found.
                                        </td>
                                    </tr>
                                ) : (
                                    currentLeads.map((lead, index) => (
                                        <tr key={lead._id || index}>
                                            <td className='heading_l data'>{indexOfFirstLead + index + 1}</td>
                                            <td className='heading_l data font-bold'>{lead.name || 'N/A'}</td>
                                            <td className='heading_l data'>{lead.email || 'N/A'}</td>
                                            <td className='heading_l data'>{lead.phone || 'N/A'}</td>
                                            <td className='heading_l data'>
                                                <span className={`status-badge ${(lead.status || 'New').toLowerCase()}`}>
                                                    {lead.status || 'New'}
                                                </span>
                                            </td>
                                            <td className='heading_l data'>{lead.source || 'Website'}</td>
                                            <td className='heading_l data'>
                                                {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-GB', {
                                                    day: 'numeric', month: 'short', year: 'numeric'
                                                }) : 'N/A'}
                                            </td>
                                            
                                            <td className='heading_l data actions-cell'>
                                                <button 
                                                    className="dots-btn"
                                                    onClick={() => setActiveActionId(activeActionId === lead._id ? null : lead._id)}
                                                >
                                                    ⋮
                                                </button>

                                                {activeActionId === lead._id && (
                                                    <div className="actions_pop_menu" ref={actionsMenuRef}>
                                                        <div className="pop_menu_title">CHANGE STATUS</div>
                                                        {['New', 'Contacted', 'Converted'].map((st) => (
                                                            <div 
                                                                key={st}
                                                                className={`pop_menu_item ${(lead.status || 'New').toLowerCase() === st.toLowerCase() ? 'active_st' : ''}`}
                                                                onClick={() => handleUpdateStatus(lead._id, st)}
                                                            >
                                                                {st}
                                                            </div>
                                                        ))}
                                                        
                                                        <hr className="pop_menu_divider" />
                                                        
                                                        <div 
                                                            className="pop_menu_item delete_item"
                                                            onClick={() => handleDeleteLead(lead._id)}
                                                        >
                                                            Delete Lead
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        <div className="table_bottom">
                            <p className="heading_l results">
                                Showing {filteredLeads.length === 0 ? 0 : indexOfFirstLead + 1} to {Math.min(indexOfLastLead, filteredLeads.length)} of {filteredLeads.length} results
                            </p>
                            
                            <div className="pagination">
                                <button 
                                    className="heading_l page-nav"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    ‹
                                </button>

                                {pageNumbers.map((number) => (
                                    <button 
                                        key={number}
                                        className={`heading_l page-num ${currentPage === number ? 'active' : ''}`}
                                        onClick={() => setCurrentPage(number)}
                                    >
                                        {number}
                                    </button>
                                ))}

                                <button 
                                    className="heading_l page-nav"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                >
                                    ›
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {isModalOpen && (
                <AddLeadSec 
                    onClose={() => setIsModalOpen(false)} 
                    onLeadAdded={fetchLeads} 
                />
            )}
        </div>
    );
}

export default LeadSec;