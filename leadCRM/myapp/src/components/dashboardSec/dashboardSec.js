import React, { useState, useEffect } from 'react'
import { CalendarBlankIcon, UsersThreeIcon, UserPlusIcon, ChatCircleDotsIcon, ChartLineUpIcon } from "@phosphor-icons/react"
import "./dashboardSec.scss"
import api from '../../api'

const DAYS = 7;
const CHART_WIDTH = 600;
const CHART_HEIGHT = 200;
const CHART_PADDING = 20;

const dayKey = (date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
const shortDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// The last DAYS calendar days (oldest first), each with the number of leads created that day per status.
const buildDailySeries = (leads) => {
    const today = new Date();
    const days = [];
    for (let i = DAYS - 1; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
        days.push({ date, key: dayKey(date), New: 0, Contacted: 0, Converted: 0 });
    }
    const byKey = Object.fromEntries(days.map((day) => [day.key, day]));
    leads.forEach((lead) => {
        if (!lead.createdAt) return;
        const day = byKey[dayKey(new Date(lead.createdAt))];
        const status = (lead.status || 'New').toLowerCase();
        if (!day) return;
        if (status === 'contacted') day.Contacted += 1;
        else if (status === 'converted') day.Converted += 1;
        else day.New += 1;
    });
    return days;
};

const DashboardSec = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/api/leads');
                if (response.data.success) {
                    setLeads(response.data.data);
                } else {
                    setError('Could not load dashboard data.');
                }
            } catch (err) {
                setError('Could not load dashboard data. Please refresh the page.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const countStatus = (status) => leads.filter(l => (l.status || 'New').toLowerCase() === status).length;
    const stats = {
        total: leads.length,
        newLeads: countStatus('new'),
        contacted: countStatus('contacted'),
        converted: countStatus('converted')
    };

    const series = buildDailySeries(leads);
    const addedLastWeek = series.reduce((sum, day) => sum + day.New + day.Contacted + day.Converted, 0);
    const maxCount = Math.max(...series.map((day) => Math.max(day.New, day.Contacted, day.Converted)), 0);
    const yMax = Math.max(4, Math.ceil(maxCount / 4) * 4);
    const yLabels = [yMax, (yMax * 3) / 4, yMax / 2, yMax / 4, 0];

    const getX = (index) => (index * CHART_WIDTH) / (DAYS - 1);
    const getY = (count) => CHART_HEIGHT - CHART_PADDING - (count / yMax) * (CHART_HEIGHT - 2 * CHART_PADDING);
    const linePath = (status) => series.map((day, i) => `${i === 0 ? 'M' : 'L'}${getX(i)},${getY(day[status])}`).join(' ');

    const getPercentValue = (value) => (stats.total === 0 ? 0 : (value / stats.total) * 100);
    const calculatePercent = (value) => getPercentValue(value).toFixed(1) + "%";

    const pNew = getPercentValue(stats.newLeads);
    const pContacted = getPercentValue(stats.contacted);

    const donutStyle = {
        background: stats.total === 0
            ? '#333'
            : `conic-gradient(
                #a855f7 0% ${pNew}%,
                #3b82f6 ${pNew}% ${pNew + pContacted}%,
                #22c55e ${pNew + pContacted}% 100%
            )`
    };

    const rangeText = `${shortDate(series[0].date)}, ${series[0].date.getFullYear()} - ${shortDate(series[DAYS - 1].date)}, ${series[DAYS - 1].date.getFullYear()}`;

    return (
        <div className="dashboard_sec">
            <div className="container">
                <div className="dashboard_inr">
                    <div className="content_otr">
                        <div className="content">
                            <h1 className="heading_h1 heading">Dashboard</h1>
                            <p className="heading_l desc">Overview of your leads and activities</p>
                        </div>
                        <div className="date_picker_otr">
                            <p className="heading_l date">{rangeText}</p>
                            <CalendarBlankIcon size={22} className="icon" />
                        </div>
                    </div>
                    {error && <p className="heading_l desc" role="alert">{error}</p>}
                    {loading && <p className="heading_l desc">Loading dashboard...</p>}
                    <div className="row">
                        <div className="col_card_otr">
                            <div className="col_card_inr">
                                <div className="icon_otr">
                                    <UsersThreeIcon weight="fill" size={62} className="icon" />
                                </div>
                                <div className="content_otr">
                                    <p className="heading_l label">Total Leads</p>
                                    <h2 className="heading_h2 num">{stats.total}</h2>
                                    <p className="heading_m text"><span className='text_inr'>{addedLastWeek}</span> added in the last {DAYS} days</p>
                                </div>
                            </div>
                        </div>
                        <div className="col_card_otr">
                            <div className="col_card_inr">
                                <div className="icon_otr">
                                    <UserPlusIcon weight="fill" size={62} className="icon" />
                                </div>
                                <div className="content_otr">
                                    <p className="heading_l label">New Lead</p>
                                    <h2 className="heading_h2 num">{stats.newLeads}</h2>
                                    <p className="heading_m text"><span className='text_inr'>{calculatePercent(stats.newLeads)}</span> of all leads</p>
                                </div>
                            </div>
                        </div>
                        <div className="col_card_otr">
                            <div className="col_card_inr">
                                <div className="icon_otr">
                                    <ChatCircleDotsIcon weight="fill" size={62} className="icon" />
                                </div>
                                <div className="content_otr">
                                    <p className="heading_l label">Contacted</p>
                                    <h2 className="heading_h2 num">{stats.contacted}</h2>
                                    <p className="heading_m text"><span className='text_inr'>{calculatePercent(stats.contacted)}</span> of all leads</p>
                                </div>
                            </div>
                        </div>
                        <div className="col_card_otr">
                            <div className="col_card_inr">
                                <div className="icon_otr">
                                    <ChartLineUpIcon weight="fill" size={62} className="icon" />
                                </div>
                                <div className="content_otr">
                                    <p className="heading_l label">Converted</p>
                                    <h2 className="heading_h2 num">{stats.converted}</h2>
                                    <p className="heading_m text"><span className='text_inr'>{calculatePercent(stats.converted)}</span> of all leads</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row2">
                        <div className="col_graph_otr">
                            <div className="col_graph_inr">
                                <div className="graph_top">
                                    <h3 className="haeing_h3 heading">Leads Created (last {DAYS} days)</h3>
                                    <div className="legend">
                                        <div className="legend-item">
                                            <div className="dot purple"></div><p className="heading_l text">New</p>
                                        </div>
                                        <div className="legend-item">
                                            <div className="dot blue"></div><p className="heading_l text">Contacted</p>
                                        </div>
                                        <div className="legend-item">
                                            <div className="dot green"></div> <p className="heading_l text">Converted</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="chart-wrapper">
                                    <div className="y-axis">
                                        {yLabels.map((label) => (
                                            <p className='heading_l num' key={label}>{label}</p>
                                        ))}
                                    </div>
                                    <div className="svg-container">
                                        <svg viewBox="0 0 600 200" preserveAspectRatio="none" className="graph-svg" role="img" aria-label="Leads created per day by status">
                                            <line x1="0" y1="0" x2="600" y2="0" className="grid-line" />
                                            <line x1="0" y1="50" x2="600" y2="50" className="grid-line" />
                                            <line x1="0" y1="100" x2="600" y2="100" className="grid-line" />
                                            <line x1="0" y1="150" x2="600" y2="150" className="grid-line" />
                                            <line x1="0" y1="200" x2="600" y2="200" className="grid-line" />

                                            <path d={linePath('New')} className="line-new" />
                                            <path d={linePath('Contacted')} className="line-contacted" />
                                            <path d={linePath('Converted')} className="line-converted" />
                                        </svg>
                                    </div>
                                    <div className="x-axis">
                                        {series.map((day) => (
                                            <p className='heading_l num' key={day.key}>{shortDate(day.date)}</p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col_chart_otr">
                            <div className="col_chart_inr">
                                <h3 className="heading_h3 heading">Leads by Status</h3>
                                <div className="content-wrapper">
                                    <div className="donut-chart-container">
                                        <div className="donut-chart" style={donutStyle}>
                                            <div className="center-text">
                                                <h3 className="heading_h3 count">{stats.total}</h3>
                                                <p className="heading_l label">Total</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="status-list">
                                        <div className="status-item">
                                            <div className="info">
                                                <div className="dot purple"></div>
                                                <p className="heading_l name">New</p>
                                            </div>
                                            <div className="values">
                                                <p className="heading_l number">{stats.newLeads}</p>
                                                <p className="heading_l percent">({calculatePercent(stats.newLeads)})</p>
                                            </div>
                                        </div>

                                        <div className="status-item">
                                            <div className="info">
                                                <div className="dot blue"></div>
                                                <p className="heading_l name">Contacted</p>
                                            </div>
                                            <div className="values">
                                                <p className="heading_l number">{stats.contacted}</p>
                                                <p className="heading_l percent">({calculatePercent(stats.contacted)})</p>
                                            </div>
                                        </div>

                                        <div className="status-item">
                                            <div className="info">
                                                <div className="dot green"></div>
                                                <p className="heading_l name">Converted</p>
                                            </div>
                                            <div className="values">
                                                <p className="heading_l number">{stats.converted}</p>
                                                <p className="heading_l percent">({calculatePercent(stats.converted)})</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default DashboardSec;
