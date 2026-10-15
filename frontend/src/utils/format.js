// Change 'INR' / 'en-IN' (and the ₹ labels in the UI) to use another currency.
const CURRENCY = 'INR';
const LOCALE = 'en-IN';

const money = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  maximumFractionDigits: 0,
});
const money2 = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const fmt = (n) => money.format(Number(n) || 0);
export const fmt2 = (n) => money2.format(Number(n) || 0);

export const fmtCompact = (n) => {
  const v = Number(n) || 0;
  const a = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (a >= 10000000) return `${sign}₹${(a / 10000000).toFixed(1)}Cr`;
  if (a >= 100000) return `${sign}₹${(a / 100000).toFixed(1)}L`;
  if (a >= 1000) return `${sign}₹${(a / 1000).toFixed(a >= 10000 ? 0 : 1)}k`;
  return `${sign}₹${Math.round(a)}`;
};

const pad = (n) => String(n).padStart(2, '0');

export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
export const parseISO = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const parseMonthKey = (k) => {
  const [y, m] = k.split('-').map(Number);
  return new Date(y, m - 1, 1);
};
export const addMonths = (key, delta) => {
  const d = parseMonthKey(key);
  d.setMonth(d.getMonth() + delta);
  return monthKey(d);
};
export const monthLabel = (key, short = false) =>
  parseMonthKey(key).toLocaleDateString('en-IN', {
    month: short ? 'short' : 'long',
    year: short ? undefined : 'numeric',
  });
export const monthRange = (key) => {
  const start = parseMonthKey(key);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  return { from: toISO(start), to: toISO(end) };
};
export const daysInMonth = (key) => {
  const d = parseMonthKey(key);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
};
export const prettyDate = (iso) =>
  parseISO(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
export const dayHeading = (iso) => {
  const today = toISO(new Date());
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (iso === today) return 'Today';
  if (iso === toISO(y)) return 'Yesterday';
  return parseISO(iso).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
};

export const greeting = () => {
  const h = new Date().getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
export const downloadCSV = (rows, filename = 'transactions.csv') => {
  const head = ['Date', 'Type', 'Category', 'Description', 'Amount'];
  const lines = [head.map(csvCell).join(',')];
  rows.forEach((t) =>
    lines.push([t.date, t.type, t.category, t.description, t.amount].map(csvCell).join(','))
  );
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
