// Helpers that turn the authenticated user's real leads into the numbers shown in the UI.
export const STATUSES = ['New', 'Contacted', 'Converted'];

// Older leads were saved with lower-case statuses ("new"); always use the canonical label.
export const statusLabel = (status) => {
    const wanted = (status || 'New').toLowerCase();
    return STATUSES.find((s) => s.toLowerCase() === wanted) || status || 'New';
};

export const countByStatus = (leads) => {
    const counts = { New: 0, Contacted: 0, Converted: 0 };
    leads.forEach((lead) => {
        const label = statusLabel(lead.status);
        if (counts[label] !== undefined) counts[label] += 1;
    });
    return counts;
};

// Counts leads per value of a text field (e.g. source, assignedTo), largest first. Blank values are grouped.
export const groupCount = (leads, field, blankLabel = 'Unspecified') => {
    const map = new Map();
    leads.forEach((lead) => {
        const key = (lead[field] || '').trim() || blankLabel;
        map.set(key, (map.get(key) || 0) + 1);
    });
    return [...map.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
};

const dayKey = (date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
export const shortDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// The last `days` calendar days (oldest first) with the number of leads created that day per status.
export const buildDailySeries = (leads, days = 7) => {
    const today = new Date();
    const series = [];
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
        series.push({ date, key: dayKey(date), New: 0, Contacted: 0, Converted: 0 });
    }
    const byKey = Object.fromEntries(series.map((day) => [day.key, day]));
    leads.forEach((lead) => {
        if (!lead.createdAt) return;
        const day = byKey[dayKey(new Date(lead.createdAt))];
        if (day) day[statusLabel(lead.status)] += 1;
    });
    return series;
};

// Leads created per calendar month for the last `months` months (oldest first).
export const buildMonthlySeries = (leads, months = 6) => {
    const now = new Date();
    const series = [];
    for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        series.push({
            key: `${date.getFullYear()}-${date.getMonth()}`,
            label: date.toLocaleDateString('en-US', { month: 'short' }),
            count: 0
        });
    }
    const byKey = Object.fromEntries(series.map((m) => [m.key, m]));
    leads.forEach((lead) => {
        if (!lead.createdAt) return;
        const d = new Date(lead.createdAt);
        const month = byKey[`${d.getFullYear()}-${d.getMonth()}`];
        if (month) month.count += 1;
    });
    return series;
};

const DAY_MS = 24 * 60 * 60 * 1000;

// Notifications are derived from the user's own data (there is no separate notification feed).
export const buildNotifications = (leads, now = Date.now()) => {
    const items = [];
    const addedToday = leads.filter((l) => l.createdAt && now - new Date(l.createdAt).getTime() < DAY_MS).length;
    if (addedToday > 0) {
        items.push({
            id: 'recent',
            text: `${addedToday} new ${addedToday === 1 ? 'lead was' : 'leads were'} added in the last 24 hours`,
            to: '/lead'
        });
    }
    const needFollowUp = leads.filter(
        (l) => statusLabel(l.status) === 'New' && l.createdAt && now - new Date(l.createdAt).getTime() > 3 * DAY_MS
    ).length;
    if (needFollowUp > 0) {
        items.push({
            id: 'followup',
            text: `${needFollowUp} ${needFollowUp === 1 ? 'lead has' : 'leads have'} been "New" for more than 3 days - follow up`,
            to: '/lead?status=New'
        });
    }
    return items;
};
