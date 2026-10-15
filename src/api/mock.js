import { addMonths, monthKey, toISO } from '../utils/format';

// Browser-only demo backend. Everything lives in localStorage.
const USERS_KEY = 'bp_mock_users';
const dataKey = (email) => `bp_mock_data_${email}`;
const wait = (ms = 140) => new Promise((r) => setTimeout(r, ms));

const read = (k, fallback) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const currentEmail = () => {
  const token = localStorage.getItem('bp_token') || '';
  if (!token.startsWith('mock-')) {
    const err = new Error('Please sign in again');
    window.dispatchEvent(new CustomEvent('bp:unauthorized'));
    throw err;
  }
  return token.slice(5);
};
const load = () => read(dataKey(currentEmail()), { transactions: [], budgets: [], seq: 1 });
const save = (d) => write(dataKey(currentEmail()), d);

// Deterministic pseudo-random so the demo looks the same every time.
const rng = (seed) => () => {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
};

const seedDemo = (email) => {
  const rand = rng(42);
  const now = new Date();
  const tx = [];
  let id = 1;
  const add = (type, amount, category, date, description) =>
    tx.push({ id: id++, type, amount: Math.round(amount), category, date: toISO(date), description });

  for (let back = 5; back >= 0; back--) {
    const first = new Date(now.getFullYear(), now.getMonth() - back, 1);
    const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const isCurrent = back === 0;
    const maxDay = isCurrent ? now.getDate() : last;
    const day = (n) => new Date(first.getFullYear(), first.getMonth(), Math.min(n, maxDay));

    if (maxDay >= 1) add('INCOME', 72000 + Math.round(rand() * 3000), 'Salary', day(1), 'Monthly salary');
    if (maxDay >= 12 && rand() > 0.35) add('INCOME', 6000 + rand() * 9000, 'Freelance', day(12), 'Design project');
    if (maxDay >= 5) add('EXPENSE', 18000, 'Rent & Housing', day(5), 'Rent');
    if (maxDay >= 8) add('EXPENSE', 1200 + rand() * 400, 'Bills & Utilities', day(8), 'Electricity');
    if (maxDay >= 9) add('EXPENSE', 799, 'Bills & Utilities', day(9), 'Broadband');
    if (maxDay >= 3) add('EXPENSE', 649, 'Entertainment', day(3), 'Streaming');

    for (let d = 1; d <= maxDay; d++) {
      if (rand() > 0.45) add('EXPENSE', 120 + rand() * 650, 'Food & Dining', day(d), ['Swiggy', 'Cafe', 'Lunch', 'Zomato'][Math.floor(rand() * 4)]);
      if (rand() > 0.82) add('EXPENSE', 700 + rand() * 1800, 'Groceries', day(d), 'DMart');
      if (rand() > 0.7) add('EXPENSE', 60 + rand() * 360, 'Transport', day(d), ['Uber', 'Metro', 'Auto'][Math.floor(rand() * 3)]);
      if (rand() > 0.93) add('EXPENSE', 600 + rand() * 3200, 'Shopping', day(d), 'Amazon');
      if (rand() > 0.96) add('EXPENSE', 300 + rand() * 1500, 'Health', day(d), 'Pharmacy');
    }
  }

  const mk = monthKey(now);
  const budgets = [
    ['Groceries', 8000],
    ['Food & Dining', 7000],
    ['Transport', 3500],
    ['Rent & Housing', 18000],
    ['Bills & Utilities', 3000],
    ['Shopping', 4500],
    ['Entertainment', 2000],
    ['Health', 2500],
  ];
  const bs = [];
  [mk, addMonths(mk, -1)].forEach((m) =>
    budgets.forEach(([category, limit]) => bs.push({ id: id++, category, limit, month: m }))
  );
  write(dataKey(email), { transactions: tx, budgets: bs, seq: id + 1 });
};

const fail = (message) => {
  throw new Error(message);
};

export const mockApi = {
  async login(email, password) {
    await wait();
    const users = read(USERS_KEY, {});
    const u = users[email.toLowerCase()];
    if (!u || u.password !== password) fail('Incorrect email or password');
    return { token: `mock-${u.email}`, user: { name: u.name, email: u.email } };
  },
  async register(name, email, password) {
    await wait();
    const users = read(USERS_KEY, {});
    const key = email.toLowerCase();
    if (users[key]) fail('An account with this email already exists');
    users[key] = { name, email: key, password };
    write(USERS_KEY, users);
    write(dataKey(key), { transactions: [], budgets: [], seq: 1 });
    return { token: `mock-${key}`, user: { name, email: key } };
  },
  async demoLogin() {
    await wait(300);
    const users = read(USERS_KEY, {});
    const email = 'demo@example.com';
    if (!users[email]) {
      users[email] = { name: 'Demo User', email, password: 'demo1234' };
      write(USERS_KEY, users);
    }
    if (!localStorage.getItem(dataKey(email))) seedDemo(email);
    return { token: `mock-${email}`, user: { name: 'Demo User', email } };
  },

  async getTransactions({ from, to, type, category } = {}) {
    await wait(80);
    return load()
      .transactions.filter(
        (t) =>
          (!from || t.date >= from) &&
          (!to || t.date <= to) &&
          (!type || t.type === type) &&
          (!category || t.category === category)
      )
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id));
  },
  async createTransaction(body) {
    await wait(80);
    const d = load();
    const t = { ...body, amount: Number(body.amount), id: d.seq++ };
    d.transactions.push(t);
    save(d);
    return t;
  },
  async updateTransaction(id, body) {
    await wait(80);
    const d = load();
    const i = d.transactions.findIndex((t) => t.id === id);
    if (i < 0) fail('Transaction not found');
    d.transactions[i] = { ...body, amount: Number(body.amount), id };
    save(d);
    return d.transactions[i];
  },
  async deleteTransaction(id) {
    await wait(60);
    const d = load();
    d.transactions = d.transactions.filter((t) => t.id !== id);
    save(d);
  },

  async getBudgets(month) {
    await wait(60);
    return load().budgets.filter((b) => b.month === month);
  },
  async saveBudget({ category, limit, month }) {
    await wait(60);
    const d = load();
    let b = d.budgets.find((x) => x.category === category && x.month === month);
    if (b) b.limit = Number(limit);
    else {
      b = { id: d.seq++, category, limit: Number(limit), month };
      d.budgets.push(b);
    }
    save(d);
    return b;
  },
  async deleteBudget(id) {
    await wait(60);
    const d = load();
    d.budgets = d.budgets.filter((b) => b.id !== id);
    save(d);
  },
};
