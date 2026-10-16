import { statusLabel, countByStatus, groupCount, buildMonthlySeries, buildDailySeries, buildNotifications } from './leadUtils';

const day = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-10-17T12:00:00Z').getTime();
const ago = (ms) => new Date(NOW - ms).toISOString();

test('statusLabel maps any casing to the canonical label and defaults to New', () => {
  expect(statusLabel('new')).toBe('New');
  expect(statusLabel('CONTACTED')).toBe('Contacted');
  expect(statusLabel(undefined)).toBe('New');
});

test('countByStatus counts leads per canonical status, including legacy lower-case ones', () => {
  expect(countByStatus([{ status: 'new' }, { status: 'New' }, { status: 'contacted' }, { status: 'Converted' }, {}]))
    .toEqual({ New: 3, Contacted: 1, Converted: 1 });
});

test('groupCount groups by field, sorts by size and labels blanks', () => {
  const rows = groupCount([{ source: 'Web' }, { source: 'Web' }, { source: 'Referral' }, { source: '  ' }], 'source');
  expect(rows).toEqual([
    { label: 'Web', count: 2 },
    { label: 'Referral', count: 1 },
    { label: 'Unspecified', count: 1 }
  ]);
});

test("buildDailySeries returns the requested number of days and counts today's leads", () => {
  const series = buildDailySeries([{ status: 'Converted', createdAt: new Date().toISOString() }], 7);
  expect(series).toHaveLength(7);
  expect(series[6].Converted).toBe(1);
  expect(series.slice(0, 6).every((d) => d.New + d.Contacted + d.Converted === 0)).toBe(true);
});

test('buildMonthlySeries counts only leads inside the window', () => {
  const series = buildMonthlySeries([{ createdAt: new Date().toISOString() }, { createdAt: '2001-01-01T00:00:00Z' }], 6);
  expect(series).toHaveLength(6);
  expect(series[5].count).toBe(1);
  expect(series.reduce((sum, m) => sum + m.count, 0)).toBe(1);
});

test('buildNotifications reports recent leads and stale "New" leads, and nothing when quiet', () => {
  expect(buildNotifications([], NOW)).toEqual([]);

  const items = buildNotifications(
    [
      { status: 'New', createdAt: ago(2 * 60 * 60 * 1000) },
      { status: 'new', createdAt: ago(5 * day) },
      { status: 'Converted', createdAt: ago(10 * day) }
    ],
    NOW
  );
  expect(items.map((i) => i.id)).toEqual(['recent', 'followup']);
  expect(items[0].text).toMatch(/^1 new lead was added/);
  expect(items[1].text).toMatch(/^1 lead has been "New"/);
  expect(items[1].to).toBe('/lead?status=New');
});
