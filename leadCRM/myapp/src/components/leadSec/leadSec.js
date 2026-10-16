import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from "react-router-dom";
import { MagnifyingGlassIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import "./leadSec.scss";
import AddLeadSec from "../addLeadSec/addLeadSec";
import api from '../../api';
import useLeads from '../../useLeads';
import { STATUSES, statusLabel } from '../../leadUtils';

const LEADS_PER_PAGE = 8;

const LeadSec = () => {
    const [searchParams] = useSearchParams();
    const { leads, loading, error, reload } = useLeads();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const initialStatus = STATUSES.find((s) => s.toLowerCase() === (searchParams.get('status') || '').toLowerCase());
    const [selectedStatus, setSelectedStatus] = useState(initialStatus || 'All');
    const [currentPage, setCurrentPage] = useState(1);
    const [busyId, setBusyId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [actionError, setActionError] = useState('');

    // The header search box navigates here with ?q=...; keep the filters in sync with the address bar.
    useEffect(() => {
        setSearchQuery(searchParams.get('q') || '');
        const fromUrl = STATUSES.find((s) => s.toLowerCase() === (searchParams.get('status') || '').toLowerCase());
        setSelectedStatus(fromUrl || 'All');
    }, [searchParams]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedStatus]);

    const filteredLeads = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return leads.filter((lead) => {
            if (!lead) return false;
            const matchesSearch = !query
                || (lead.name || '').toLowerCase().includes(query)
                || (lead.email || '').toLowerCase().includes(query)
                || (lead.phone || '').toLowerCase().includes(query);
            const matchesStatus = selectedStatus === 'All' || statusLabel(lead.status) === selectedStatus;
            return matchesSearch && matchesStatus;
        });
    }, [leads, searchQuery, selectedStatus]);

    const totalPages = Math.max(1, Math.ceil(filteredLeads.length / LEADS_PER_PAGE));
    const page = Math.min(currentPage, totalPages);
    const firstIndex = (page - 1) * LEADS_PER_PAGE;
    const pageLeads = filteredLeads.slice(firstIndex, firstIndex + LEADS_PER_PAGE);

    const describeError = (err, fallback) =>
        err.response ? err.response.data?.message || fallback : 'Could not reach the server. Check your connection and try again.';

    const handleUpdateStatus = async (id, newStatus) => {
        setActionError('');
        setBusyId(id);
        try {
            await api.put(`/api/leads/${id}`, { status: newStatus });
            await reload();
        } catch (err) {
            setActionError(describeError(err, 'Failed to update the status.'));
        } finally {
            setBusyId(null);
        }
    };

    const handleDeleteLead = async (id) => {
        setActionError('');
        setBusyId(id);
        try {
            await api.delete(`/api/leads/${id}`);
            setConfirmDeleteId(null);
            await reload();
        } catch (err) {
            setActionError(describeError(err, 'Failed to delete the lead.'));
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="lead_sec">
            <div className="page_head">
                <div>
                    <h1 className="heading_h1 heading">Leads</h1>
                    <p className="heading_l desc">Manage and track your leads</p>
                </div>
                <button type="button" className="primary_btn" onClick={() => setIsModalOpen(true)}>
                    <PlusIcon size={18} /> Add Lead
                </button>
            </div>

            <div className="filters">
                <label className="search_field">
                    <MagnifyingGlassIcon size={18} aria-hidden="true" />
                    <input
                        type="search"
                        placeholder="Search by name, email or phone"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Search leads"
                    />
                </label>
                <label className="status_field">
                    <span className="sr_only">Filter by status</span>
                    <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} aria-label="Filter by status">
                        <option value="All">All Status</option>
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                </label>
            </div>

            {error && <div className="notice error" role="alert">{error}</div>}
            {actionError && <div className="notice error" role="alert">{actionError}</div>}

            <div className="card table_card">
                <table className="leads_table">
                    <thead>
                        <tr>
                            <th className="heading_l">#</th>
                            <th className="heading_l">Name</th>
                            <th className="heading_l">Email</th>
                            <th className="heading_l col_phone">Phone</th>
                            <th className="heading_l">Status</th>
                            <th className="heading_l col_source">Source</th>
                            <th className="heading_l col_created">Created</th>
                            <th className="heading_l col_actions"><span className="sr_only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr className="state_row"><td colSpan="8" className="heading_l">Loading leads...</td></tr>
                        ) : pageLeads.length === 0 ? (
                            <tr className="state_row">
                                <td colSpan="8" className="heading_l">
                                    {leads.length === 0 ? 'No leads yet. Use "Add Lead" to create your first one.' : 'No leads match your search.'}
                                </td>
                            </tr>
                        ) : (
                            pageLeads.map((lead, index) => {
                                const label = statusLabel(lead.status);
                                const busy = busyId === lead._id;
                                return (
                                    <tr key={lead._id}>
                                        <td data-label="#" className="heading_l col_index">{firstIndex + index + 1}</td>
                                        <td data-label="Name" className="heading_l strong">{lead.name || 'N/A'}</td>
                                        <td data-label="Email" className="heading_l wrap">{lead.email || 'N/A'}</td>
                                        <td data-label="Phone" className="heading_l col_phone">{lead.phone || 'N/A'}</td>
                                        <td data-label="Status" className="heading_l">
                                            <select
                                                className={`status_select ${label.toLowerCase()}`}
                                                value={label}
                                                disabled={busy}
                                                onChange={(e) => handleUpdateStatus(lead._id, e.target.value)}
                                                aria-label={`Status for ${lead.name || 'lead'}`}
                                            >
                                                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </td>
                                        <td data-label="Source" className="heading_l col_source">{lead.source || 'Website'}</td>
                                        <td data-label="Created" className="heading_l col_created">
                                            {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                        </td>
                                        <td className="col_actions">
                                            {confirmDeleteId === lead._id ? (
                                                <span className="confirm_delete">
                                                    <button type="button" className="danger_btn" disabled={busy} onClick={() => handleDeleteLead(lead._id)}>
                                                        Confirm delete
                                                    </button>
                                                    <button type="button" className="link_btn" disabled={busy} onClick={() => setConfirmDeleteId(null)}>
                                                        Cancel
                                                    </button>
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="icon_action"
                                                    onClick={() => setConfirmDeleteId(lead._id)}
                                                    aria-label={`Delete ${lead.name || 'lead'}`}
                                                    title="Delete lead"
                                                >
                                                    <TrashIcon size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>

                <div className="table_bottom">
                    <p className="heading_l results">
                        Showing {filteredLeads.length === 0 ? 0 : firstIndex + 1} to {Math.min(firstIndex + LEADS_PER_PAGE, filteredLeads.length)} of {filteredLeads.length} results
                    </p>
                    <div className="pagination">
                        <button type="button" className="page_btn" onClick={() => setCurrentPage(Math.max(page - 1, 1))} disabled={page === 1} aria-label="Previous page">
                            ‹
                        </button>
                        <span className="heading_l page_info">Page {page} of {totalPages}</span>
                        <button type="button" className="page_btn" onClick={() => setCurrentPage(Math.min(page + 1, totalPages))} disabled={page === totalPages} aria-label="Next page">
                            ›
                        </button>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <AddLeadSec
                    variant="modal"
                    onClose={() => setIsModalOpen(false)}
                    onLeadAdded={reload}
                />
            )}
        </div>
    );
}

export default LeadSec;
