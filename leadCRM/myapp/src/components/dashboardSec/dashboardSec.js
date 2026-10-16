import React, { useState, useEffect } from 'react'
import { CalendarBlankIcon, UsersThreeIcon, ArrowUpIcon, UserPlusIcon, ChatCircleDotsIcon, ChartLineUpIcon } from "@phosphor-icons/react"
import "./dashboardSec.scss"
import api from '../../api'

const DashboardSec = () => {
    
    const [, setLeads] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        newLeads: 0,
        contacted: 0,
        converted: 0
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/api/leads');
                if (response.data.success) {
                    const allLeads = response.data.data;
                    setLeads(allLeads);

                    const countNew = allLeads.filter(l => l.status?.toLowerCase() === 'new').length;
                    const countContacted = allLeads.filter(l => l.status?.toLowerCase() === 'contacted').length;
                    
                    const countConverted = allLeads.filter(l => 
                        l.status?.toLowerCase() === 'converted' || l.status?.toLowerCase() === 'won' || l.status?.toLowerCase() === 'qualified'
                    ).length;

                    setStats({
                        total: allLeads.length,
                        newLeads: countNew,
                        contacted: countContacted,
                        converted: countConverted
                    });
                }
            } catch (error) {
                console.error("Dashboard stats fetch karne mein masla aya:", error);
            }
        };

        fetchDashboardData();
    }, []);

    const getPercentValue = (value) => {
        if (stats.total === 0) return 0;
        return (value / stats.total) * 100;
    };

    const calculatePercent = (value) => {
        return getPercentValue(value).toFixed(1) + "%";
    };

    const getGraphY = (value) => {
        const percentage = getPercentValue(value);

        return 200 - (percentage * 1.5) - 20; 
    };

    const yNew = getGraphY(stats.newLeads);
    const yContacted = getGraphY(stats.contacted);
    const yConverted = getGraphY(stats.converted);

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
                            <p className="heading_l date">May 10, 2026 - May 20, 2026</p>
                            <CalendarBlankIcon size={22} className="icon" />
                        </div>
                    </div>
                    <div className="row">
                        <div className="col_card_otr">
                            <div className="col_card_inr">
                                <div className="icon_otr">
                                    <UsersThreeIcon weight="fill" size={62} className="icon" />
                                </div>
                                <div className="content_otr">
                                    <p className="heading_l label">Total Leads</p>
                                    <h2 className="heading_h2 num">{stats.total}</h2>
                                    <p className="heading_m text"><ArrowUpIcon size={12} className="icon" /> <span className='text_inr'>12.5%</span> from last month</p>
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
                                    <p className="heading_m text"><ArrowUpIcon size={12} className="icon" /> <span className='text_inr'>8.2%</span> from last month</p>
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
                                    <p className="heading_m text"><ArrowUpIcon size={12} className="icon" /> <span className='text_inr'>10.1%</span> from last month</p>
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
                                    <p className="heading_m text"><ArrowUpIcon size={12} className="icon" /> <span className='text_inr'>15.3%</span> from last month</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row2">
                        <div className="col_graph_otr">
                            <div className="col_graph_inr">
                                <div className="graph_top">
                                    <h3 className="haeing_h3 heading">Leads Overview</h3>
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
                                        <p className='heading_l num'>100%</p>
                                        <p className='heading_l num'>75%</p>
                                        <p className='heading_l num'>50%</p>
                                        <p className='heading_l num'>25%</p>
                                        <p className='heading_l num'>0%</p>
                                    </div>
                                    <div className="svg-container">
                                        <svg viewBox="0 0 600 200" preserveAspectRatio="none" className="graph-svg">
                                            <line x1="0" y1="0" x2="600" y2="0" className="grid-line" />
                                            <line x1="0" y1="50" x2="600" y2="50" className="grid-line" />
                                            <line x1="0" y1="100" x2="600" y2="100" className="grid-line" />
                                            <line x1="0" y1="150" x2="600" y2="150" className="grid-line" />
                                            <line x1="0" y1="200" x2="600" y2="200" className="grid-line" />
                                            
                                         
                                            <path
                                                d={`M0,${yNew} C150,${yNew - 30} 300,${yNew + 30} 450,${yNew - 15} 600,${yNew}`}
                                                className="line-new"
                                            />
                                            <path
                                                d={`M0,${yContacted} C150,${yContacted + 20} 300,${yContacted - 40} 450,${yContacted + 10} 600,${yContacted}`}
                                                className="line-contacted"
                                            />
                                            <path
                                                d={`M0,${yConverted} C150,${yConverted - 10} 300,${yConverted + 20} 450,${yConverted - 30} 600,${yConverted}`}
                                                className="line-converted"
                                            />
                                        </svg>
                                    </div>
                                    <div className="x-axis">
                                        <p className='heading_l num'>May 18</p>
                                        <p className='heading_l num'>May 25</p>
                                        <p className='heading_l num'>Jun 01</p>
                                        <p className='heading_l num'>Jun 08</p>
                                        <p className='heading_l num'>Jun 15</p>
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