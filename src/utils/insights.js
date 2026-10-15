import { addMonths, daysInMonth, monthKey, parseMonthKey } from './format';

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

// Everything the dashboard shows is derived here from the raw transaction list.
export function analyse({ txns, budgets, month, now = new Date() }) {
  const current = monthKey(now);
  const dim = daysInMonth(month);
  const isCurrent = month === current;
  const isPast = month < current;
  const elapsed = isCurrent ? now.getDate() : isPast ? dim : 0;
  const remaining = isCurrent ? dim - now.getDate() + 1 : 0;

  const inMonth = txns.filter((t) => t.date.startsWith(month));
  const income = inMonth.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const expenses = inMonth.filter((t) => t.type === 'EXPENSE');
  const expense = expenses.reduce((s, t) => s + t.amount, 0);
  const savings = income - expense;
  const savingsRate = income > 0 ? savings / income : 0;

  const catMap = {};
  expenses.forEach((t) => (catMap[t.category] = (catMap[t.category] || 0) + t.amount));
  const byCategory = Object.entries(catMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const daily = Array.from({ length: dim }, () => 0);
  expenses.forEach((t) => {
    daily[Number(t.date.slice(8, 10)) - 1] += t.amount;
  });

  const trend = Array.from({ length: 6 }, (_, i) => {
    const m = addMonths(month, i - 5);
    const rows = txns.filter((t) => t.date.startsWith(m));
    return {
      key: m,
      income: rows.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0),
      expense: rows.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0),
    };
  });

  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const basis = totalBudget > 0 ? totalBudget : income > 0 ? Math.round(income * 0.8) : 0;
  const left = basis - expense;
  const safePerDay = isCurrent && remaining > 0 ? Math.max(0, left) / remaining : 0;

  const timePct = dim ? elapsed / dim : 0;
  const spentPct = basis > 0 ? expense / basis : 0;

  // Budget alerts
  const alerts = budgets
    .map((b) => {
      const spent = catMap[b.category] || 0;
      return { ...b, spent, pct: b.limit ? spent / b.limit : 0 };
    })
    .filter((b) => b.pct >= 0.8)
    .sort((a, b) => b.pct - a.pct);

  // Money Health score (0-100)
  const s1 = clamp(savingsRate / 0.3, 0, 1) * 40;
  const ok = budgets.filter((b) => (catMap[b.category] || 0) <= b.limit).length;
  const s2 = budgets.length ? (ok / budgets.length) * 30 : 15;
  let s3 = 15;
  if (basis > 0 && timePct > 0) {
    const ratio = spentPct / timePct;
    s3 = ratio <= 1 ? 30 : clamp(30 - (ratio - 1) * 60, 0, 30);
  }
  const hasData = inMonth.length > 0;
  const score = hasData ? Math.round(s1 + s2 + s3) : 0;
  const label = !hasData ? 'No data yet' : score >= 80 ? 'Thriving' : score >= 60 ? 'Steady' : score >= 40 ? 'Watch out' : 'Needs love';

  // No-spend streak (counting back from today, or from the month's last day)
  const lastDay = isCurrent ? now.getDate() : isPast ? dim : 0;
  let streak = 0;
  for (let d = lastDay; d >= 1 && daily[d - 1] === 0; d--) streak++;
  const noSpendDays = daily.slice(0, lastDay).filter((v) => v === 0).length;

  const first = parseMonthKey(month);
  const startOffset = (first.getDay() + 6) % 7; // Monday first
  const maxDaily = Math.max(0, ...daily);

  return {
    inMonth, income, expense, savings, savingsRate, byCategory, daily, trend,
    totalBudget, basis, left, safePerDay, timePct, spentPct, alerts,
    score, label, streak, noSpendDays, startOffset, maxDaily,
    isCurrent, isPast, elapsed, remaining, dim,
    parts: { saving: Math.round(s1), budgets: Math.round(s2), pace: Math.round(s3) },
  };
}
