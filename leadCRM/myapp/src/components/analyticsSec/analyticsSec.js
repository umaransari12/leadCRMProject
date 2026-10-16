import React from 'react'
import { Link } from 'react-router-dom'
import "./analyticsSec.scss"
import useLeads from '../../useLeads'
import { countByStatus, groupCount, buildMonthlySeries } from '../../leadUtils'

const BarList = ({ title, rows, emptyText }) => {
    const max = Math.max(...rows.map((row) => row.count), 1);
    return (
        <div className="card">
            <h3 className="heading_h3 card_title">{title}</h3>
            {rows.length === 0 ? (
                <p className="heading_l muted">{emptyText}</p>
            ) : (
                <ul className="bar_list">
                    {rows.slice(0, 8).map((row) => (
                        <li key={row.label}>
                            <div className="bar_label heading_l">
                                <span className="bar_name">{row.label}</span>
                                <span className="bar_count">{row.count}</span>
                            </div>
                            <div className="bar_track"><div className="bar_fill" style={{ width: `${(row.count / max) * 100}%` }} /></div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const AnalyticsSec = () => {
    const { leads, loading, error } = useLeads();

    const total = leads.length;
    const counts = countByStatus(leads);
    const conversionRate = total === 0 ? 0 : (counts.Converted / total) * 100;
    const contactRate = total === 0 ? 0 : ((counts.Contacted + counts.Converted) / total) * 100;

    const monthly = buildMonthlySeries(leads, 6);
    const monthlyMax = Math.max(...monthly.map((m) => m.count), 1);

    const bySource = groupCount(leads, 'source');
    const byAssignee = groupCount(leads, 'assignedTo', 'Unassigned');

    return (
        <div className="analytics_sec">
            <div className="page_head">
                <div>
                    <h1 className="heading_h1 heading">Analytics</h1>
                    <p className="heading_l desc">How your leads are performing</p>
                </div>
            </div>

            {error && <div className="notice error" role="alert">{error}</div>}
            {loading && <p className="heading_l muted">Loading analytics...</p>}
            {!loading && !error && total === 0 && (
                <div className="notice info">
                    There is no data to analyse yet. <Link to="/addlead">Add a lead</Link> to get started.
                </div>
            )}

            <div className="kpi_grid">
                <div className="card kpi">
                    <p className="heading_l muted">Total leads</p>
                    <p className="heading_h1 kpi_value">{total}</p>
                </div>
                <div className="card kpi">
                    <p className="heading_l muted">Contacted or converted</p>
                    <p className="heading_h1 kpi_value">{contactRate.toFixed(1)}%</p>
                </div>
                <div className="card kpi">
                    <p className="heading_l muted">Conversion rate</p>
                    <p className="heading_h1 kpi_value">{conversionRate.toFixed(1)}%</p>
                </div>
            </div>

            <div className="analytics_grid">
                <div className="card monthly_card">
                    <h3 className="heading_h3 card_title">Leads created per month</h3>
                    <div className="column_chart" role="img" aria-label="Leads created per month for the last six months">
                        {monthly.map((month) => (
                            <div className="column" key={month.key}>
                                <span className="heading_m column_value">{month.count}</span>
                                <div className="column_bar" style={{ height: `${(month.count / monthlyMax) * 100}%` }} />
                                <span className="heading_m column_label">{month.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <BarList title="Leads by source" rows={bySource} emptyText="No leads yet." />
                <BarList title="Leads by assignee" rows={byAssignee} emptyText="No leads yet." />
            </div>
        </div>
    )
}

export default AnalyticsSec;
