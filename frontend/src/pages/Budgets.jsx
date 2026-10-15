import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Check, Copy, Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import MonthNav from '../components/MonthNav';
import AnimatedNumber from '../components/AnimatedNumber';
import { Empty } from './Dashboard';
import { EXPENSE_CATEGORIES, catMeta } from '../utils/constants';
import { addMonths, fmt, monthKey, monthLabel, monthRange } from '../utils/format';

export default function Budgets() {
  const toast = useToast();
  const { tick } = useOutletContext();
  const [month, setMonth] = useState(monthKey(new Date()));
  const [budgets, setBudgets] = useState(null);
  const [spent, setSpent] = useState({});
  const [reload, setReload] = useState(0);
  const [editing, setEditing] = useState(null); // category name
  const [draft, setDraft] = useState('');
  const [newCat, setNewCat] = useState('');
  const [newLimit, setNewLimit] = useState('');

  useEffect(() => {
    let live = true;
    const { from, to } = monthRange(month);
    Promise.all([api.getBudgets(month), api.getTransactions({ from, to, type: 'EXPENSE' })])
      .then(([b, t]) => {
        if (!live) return;
        const s = {};
        t.forEach((x) => (s[x.category] = (s[x.category] || 0) + x.amount));
        setBudgets(b);
        setSpent(s);
      })
      .catch((e) => toast.error(e.message));
    return () => {
      live = false;
    };
  }, [month, tick, reload]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = useMemo(
    () =>
      (budgets || [])
        .map((b) => ({ ...b, spent: spent[b.category] || 0 }))
        .sort((a, b) => b.spent / (b.limit || 1) - a.spent / (a.limit || 1)),
    [budgets, spent]
  );

  const totalLimit = rows.reduce((s, r) => s + r.limit, 0);
  const totalSpent = rows.reduce((s, r) => s + r.spent, 0);
  const budgeted = new Set(rows.map((r) => r.category));
  const unbudgeted = Object.entries(spent).filter(([c]) => !budgeted.has(c)).sort((a, b) => b[1] - a[1]);
  const available = EXPENSE_CATEGORIES.filter((c) => !budgeted.has(c.name));

  const save = async (category, limit) => {
    const n = Number(limit);
    if (!n || n <= 0) return toast.error('Enter a limit greater than zero');
    try {
      await api.saveBudget({ category, limit: n, month });
      toast.success('Budget saved');
      setEditing(null);
      setNewCat('');
      setNewLimit('');
      setReload((r) => r + 1);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const remove = async (b) => {
    try {
      await api.deleteBudget(b.id);
      toast.success('Budget removed');
      setReload((r) => r + 1);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const copyLast = async () => {
    try {
      const prev = await api.getBudgets(addMonths(month, -1));
      const todo = prev.filter((p) => !budgeted.has(p.category));
      if (!prev.length) return toast.info(`No budgets found in ${monthLabel(addMonths(month, -1))}`);
      if (!todo.length) return toast.info('Everything from last month is already here');
      await Promise.all(todo.map((p) => api.saveBudget({ category: p.category, limit: p.limit, month })));
      toast.success(`Copied ${todo.length} budgets`);
      setReload((r) => r + 1);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const tone = (p) => (p >= 1 ? 'danger' : p >= 0.8 ? 'warn' : 'ok');

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Give every rupee a job</p>
          <h1>Budgets</h1>
        </div>
        <MonthNav month={month} onChange={setMonth} />
      </header>

      <section className="card spot budget-hero rise">
        <div>
          <p className="muted">Total budgeted</p>
          <strong className="bigfig"><AnimatedNumber value={totalLimit} /></strong>
        </div>
        <div>
          <p className="muted">Spent so far</p>
          <strong className="bigfig"><AnimatedNumber value={totalSpent} /></strong>
        </div>
        <div>
          <p className="muted">{totalLimit - totalSpent >= 0 ? 'Remaining' : 'Over by'}</p>
          <strong className={`bigfig ${totalSpent > totalLimit ? 'neg' : 'pos'}`}>
            <AnimatedNumber value={Math.abs(totalLimit - totalSpent)} />
          </strong>
        </div>
        <button className="btn btn-ghost" onClick={copyLast}>
          <Copy size={16} /> Copy last month
        </button>
      </section>

      {budgets && rows.length === 0 && (
        <section className="card"><Empty text="No budgets for this month yet. Add one below or copy last month's." /></section>
      )}

      <section className="budget-grid">
        {rows.map((b, i) => {
          const p = b.limit ? b.spent / b.limit : 0;
          const m = catMeta(b.category);
          const isEditing = editing === b.category;
          return (
            <article key={b.id} className={`card spot budget ${tone(p)} rise`} style={{ '--i': Math.min(i, 8), '--c': m.color }}>
              <div className="budget-top">
                <span className="tx-ico" style={{ '--c': m.color }}>{m.emoji}</span>
                <div className="grow">
                  <b>{b.category}</b>
                  <small className="muted">{p >= 1 ? 'Over budget' : p >= 0.8 ? 'Almost there' : 'On track'}</small>
                </div>
                <button className="icon-btn" onClick={() => { setEditing(b.category); setDraft(b.limit); }} aria-label="Edit limit"><Pencil size={16} /></button>
                <button className="icon-btn danger" onClick={() => remove(b)} aria-label="Remove budget"><Trash2 size={16} /></button>
              </div>

              <div className="meter">
                <div className="meter-fill" style={{ width: `${Math.min(100, p * 100)}%` }} />
              </div>

              {isEditing ? (
                <form className="inline-edit" onSubmit={(e) => { e.preventDefault(); save(b.category, draft); }}>
                  <span>₹</span>
                  <input autoFocus type="number" min="1" value={draft} onChange={(e) => setDraft(e.target.value)} />
                  <button className="icon-btn ok" aria-label="Save"><Check size={16} /></button>
                </form>
              ) : (
                <div className="budget-nums">
                  <span><b>{fmt(b.spent)}</b> of {fmt(b.limit)}</span>
                  <em>{Math.round(p * 100)}%</em>
                </div>
              )}
            </article>
          );
        })}
      </section>

      <section className="card rise">
        <h3>Add a budget</h3>
        {available.length === 0 ? (
          <p className="muted">Every category already has a budget.</p>
        ) : (
          <form className="add-budget" onSubmit={(e) => { e.preventDefault(); save(newCat || available[0].name, newLimit); }}>
            <select value={newCat || available[0].name} onChange={(e) => setNewCat(e.target.value)}>
              {available.map((c) => <option key={c.name} value={c.name}>{c.emoji} {c.name}</option>)}
            </select>
            <label className="input-icon"><span>₹</span>
              <input type="number" min="1" placeholder="Monthly limit" value={newLimit} onChange={(e) => setNewLimit(e.target.value)} />
            </label>
            <button className="btn btn-primary"><Plus size={16} /> Add</button>
          </form>
        )}
      </section>

      {unbudgeted.length > 0 && (
        <section className="card rise">
          <h3>Spending without a budget</h3>
          <ul className="cat-list">
            {unbudgeted.map(([c, v]) => (
              <li key={c}>
                <span className="swatch" style={{ background: catMeta(c).color }} />
                <span className="grow">{catMeta(c).emoji} {c}</span>
                <b>{fmt(v)}</b>
                <button className="chip" onClick={() => { setNewCat(c); setNewLimit(Math.ceil(v / 500) * 500); }}>Set limit</button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
