import React from 'react'
import { Link } from 'react-router-dom'
import { CalendarBlankIcon, UsersThreeIcon, UserPlusIcon, ChatCircleDotsIcon, ChartLineUpIcon } from "@phosphor-icons/react"
import "./dashboardSec.scss"
import useLeads from '../../useLeads'
import { countByStatus, buildDailySeries, shortDate } from '../../leadUtils'

const DAYS = 7;
const CHART_WIDTH = 600;
const CHART_HEIGHT = 200;
const CHART_PADDING = 16;

const DashboardSec = () => {
    const { leads, loading, error } = useLeads();

    const counts = countByStatus(leads);
    const total = leads.length;

    const series = buildDailySeries(leads, DAYS);
    const addedLastWeek = series.reduce((sum, day) => sum + day.New + day.Contacted + day.Converted, 0);
    const maxCount = Math.max(...series.map((day) => Math.max(day.New, day.Contacted, day.Converted)), 0);
    const yMax = Math.max(4, Math.ceil(maxCount / 4) * 4);
    const yLabels = [yMax, (yMax * 3) / 4, yMax / 2, yMax / 4, 0];

    const getX = (index) => (index * CHART_WIDTH) / (DAYS - 1);
    const getY = (count) => CHART_HEIGHT - CHART_PADDING - (count / yMax) * (CHART_HEIGHT - 2 * CHART_PADDING);
    const linePath = (status) => series.map((day, i) => `${i === 0 ? 'M' : 'L'}${getX(i)},${getY(day[status])}`).join(' ');

    const percentOf = (value) => (total === 0 ? 0 : (value / total) * 100);
    const formatPercent = (value) => percentOf(value).toFixed(1) + '%';
    const pNew = percentOf(counts.New);
    const pContacted = percentOf(counts.Contacted);

    const donutStyle = {
        background: total === 0
            ? '#e5e7eb'
            : `conic-gradient(
                #6366f1 0% ${pNew}%,
                #3b82f6 ${pNew}% ${pNew + pContacted}%,
                #22c55e ${pNew + pContacted}% 100%
            )`
    };

    const first = series[0].date;
    const last = series[DAYS - 1].date;
    const rangeText = `${shortDate(first)}, ${first.getFullYear()} - ${shortDate(last)}, ${last.getFullYear()}`;

    const cards = [
        { key: 'total', label: 'Total Leads', value: total, note: `${addedLastWeek} added in the last ${DAYS} days`, Icon: UsersThreeIcon },
        { key: 'new', label: 'New Leads', value: counts.New, note: `${formatPercent(counts.New)} of all leads`, Icon: UserPlusIcon },
        { key: 'contacted', label: 'Contacted', value: counts.Contacted, note: `${formatPercent(counts.Contacted)} of all leads`, Icon: ChatCircleDotsIcon },
        { key: 'converted', label: 'Converted', value: counts.Converted, note: `${formatPercent(counts.Converted)} of all leads`, Icon: ChartLineUpIcon }
    ];

    const legend = [
        { cls: 'purple', label: 'New' },
        { cls: 'blue', label: 'Contacted' },
        { cls: 'green', label: 'Converted' }
    ];

    return (
        <div className="dashboard_sec">
            <div className="page_head">
                <div>
                    <h1 className="heading_h1 heading">Dashboard</h1>
                    <p className="heading_l desc">Overview of your leads and activities</p>
                </div>
                <div className="date_pill">
                    <span className="heading_l">{rangeText}</span>
                    <CalendarBlankIcon size={20} aria-hidden="true" />
                </div>
            </div>

            {error && <div className="notice error" role="alert">{error}</div>}
            {loading && <p className="heading_l loading_text">Loading your dashboard...</p>}

            {!loading && !error && total === 0 && (
                <div className="notice info">
                    You have no leads yet. <Link to="/addlead">Add your first lead</Link> and your statistics will appear here.
                </div>
            )}

            <div className="stat_grid">
                {cards.map(({ key, label, value, note, Icon }) => (
                    <div className={`stat_card ${key}`} key={key}>
                        <div className="stat_icon"><Icon weight="fill" size={36} /></div>
                        <div className="stat_body">
                            <p className="heading_l label">{label}</p>
                            <h2 className="heading_h2 num">{value}</h2>
                            <p className="heading_m note">{note}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="chart_grid">
                <div className="card line_card">
                    <div className="card_top">
                        <h3 className="heading_h3 heading">Leads created (last {DAYS} days)</h3>
                        <div className="legend">
                            {legend.map(({ cls, label }) => (
                                <div className="legend_item" key={label}>
                                    <span className={`dot ${cls}`} />
                                    <span className="heading_m">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="line_chart">
                        <div className="y_axis" aria-hidden="true">
                            {yLabels.map((label) => (
                                <span className="heading_m" key={label}>{label}</span>
                            ))}
                        </div>
                        <div className="plot">
                            <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} preserveAspectRatio="none" role="img" aria-label="Leads created per day by status">
                                {[0, 50, 100, 150, 200].map((y) => (
                                    <line key={y} x1="0" y1={y} x2={CHART_WIDTH} y2={y} className="grid_line" />
                                ))}
                                <path d={linePath('New')} className="line new" />
                                <path d={linePath('Contacted')} className="line contacted" />
                                <path d={linePath('Converted')} className="line converted" />
                            </svg>
                        </div>
                        <div className="x_axis" aria-hidden="true">
                            {series.map((day) => (
                                <span className="heading_m" key={day.key}>{shortDate(day.date)}</span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="card donut_card">
                    <h3 className="heading_h3 heading">Leads by Status</h3>
                    <div className="donut_body">
                        <div className="donut" style={donutStyle} role="img" aria-label={`${total} leads in total`}>
                            <div className="donut_center">
                                <span className="heading_h2 count">{total}</span>
                                <span className="heading_m">Total</span>
                            </div>
                        </div>
                        <ul className="status_list">
                            {legend.map(({ cls, label }) => (
                                <li className="status_item" key={label}>
                                    <span className="info"><span className={`dot ${cls}`} /><span className="heading_l">{label}</span></span>
                                    <span className="values">
                                        <span className="heading_l number">{counts[label]}</span>
                                        <span className="heading_m percent">({formatPercent(counts[label])})</span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DashboardSec;
