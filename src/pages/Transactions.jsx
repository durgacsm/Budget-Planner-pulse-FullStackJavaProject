import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Download, Plus, Search } from 'lucide-react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import AnimatedNumber from '../components/AnimatedNumber';
import { ALL_CATEGORIES, catMeta } from '../utils/constants';
import { dayHeading, downloadCSV, fmt, monthKey, monthRange, addMonths, toISO } from '../utils/format';
import { Empty, TxRow } from './Dashboard';

const PRESETS = [
  { id: 'this', label: 'This month' },
  { id: 'last', label: 'Last month' },
  { id: '3m', label: '3 months' },
  { id: 'all', label: 'All time' },
  { id: 'custom', label: 'Custom' },
];

const presetRange = (id) => {
  const cur = monthKey(new Date());
  if (id === 'this') return monthRange(cur);
  if (id === 'last') return monthRange(addMonths(cur, -1));
  if (id === '3m') return { from: monthRange(addMonths(cur, -2)).from, to: monthRange(cur).to };
  return { from: '', to: '' };
};

export default function Transactions() {
  const toast = useToast();
  const { tick, openTx, refresh } = useOutletContext();
  const [preset, setPreset] = useState('this');
  const [custom, setCustom] = useState({ from: toISO(new Date()), to: toISO(new Date()) });
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState(null);

  const range = preset === 'custom' ? custom : presetRange(preset);

  useEffect(() => {
    let live = true;
    api
      .getTransactions({ from: range.from, to: range.to, type, category })
      .then((r) => live && setRows(r))
      .catch((e) => toast.error(e.message));
    return () => {
      live = false;
    };
  }, [range.from, range.to, type, category, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    if (!rows) return null;
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((t) => `${t.description} ${t.category}`.toLowerCase().includes(q));
  }, [rows, search]);

  const totals = useMemo(() => {
    const inc = (filtered || []).filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const exp = (filtered || []).filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    return { inc, exp, net: inc - exp };
  }, [filtered]);

  const groups = useMemo(() => {
    const g = {};
    (filtered || []).forEach((t) => (g[t.date] = [...(g[t.date] || []), t]));
    return Object.entries(g).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);

  const remove = async (t) => {
    if (!window.confirm(`Delete "${t.description || t.category}"?`)) return;
    try {
      await api.deleteTransaction(t.id);
      toast.success('Deleted');
      refresh();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Every rupee, accounted for</p>
          <h1>Transactions</h1>
        </div>
        <div className="head-actions">
          <button
            className="btn btn-ghost"
            disabled={!filtered?.length}
            onClick={() => downloadCSV(filtered, `transactions-${toISO(new Date())}.csv`)}
          >
            <Download size={16} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => openTx(null, 'EXPENSE')}>
            <Plus size={16} /> Add
          </button>
        </div>
      </header>

      <section className="card filters rise">
        <div className="chips">
          {PRESETS.map((p) => (
            <button key={p.id} className={`chip ${preset === p.id ? 'on' : ''}`} onClick={() => setPreset(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="row2 custom-range">
            <label className="field"><span className="label">From</span>
              <input type="date" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} /></label>
            <label className="field"><span className="label">To</span>
              <input type="date" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} /></label>
          </div>
        )}
        <div className="filter-row">
          <label className="input-icon grow">
            <Search size={18} />
            <input placeholder="Search description or category" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <div className="chips">
            {[['', 'All'], ['EXPENSE', 'Expenses'], ['INCOME', 'Income']].map(([v, l]) => (
              <button key={v} className={`chip ${type === v ? 'on' : ''}`} onClick={() => setType(v)}>{l}</button>
            ))}
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
            <option value="">All categories</option>
            {ALL_CATEGORIES.map((c) => <option key={c.name} value={c.name}>{c.emoji} {c.name}</option>)}
          </select>
        </div>
      </section>

      <section className="grid-3">
        <div className="card mini rise" style={{ '--i': 1 }}><p>Income</p><strong className="pos"><AnimatedNumber value={totals.inc} /></strong></div>
        <div className="card mini rise" style={{ '--i': 2 }}><p>Expenses</p><strong><AnimatedNumber value={totals.exp} /></strong></div>
        <div className="card mini rise" style={{ '--i': 3 }}><p>Net</p><strong className={totals.net < 0 ? 'neg' : 'pos'}><AnimatedNumber value={totals.net} /></strong></div>
      </section>

      {!filtered ? (
        <div className="skeleton" style={{ height: 260 }} />
      ) : groups.length === 0 ? (
        <section className="card">
          <Empty text="No transactions match these filters." action={<button className="btn btn-primary" onClick={() => openTx(null, 'EXPENSE')}><Plus size={16} /> Add one</button>} />
        </section>
      ) : (
        groups.map(([date, list], gi) => (
          <section key={date} className="day-group rise" style={{ '--i': Math.min(gi, 8) }}>
            <div className="day-head">
              <h4>{dayHeading(date)}</h4>
              <span className="muted">
                {fmt(list.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0))} spent
              </span>
            </div>
            <div className="card tx-card">
              <ul className="tx-list">
                {list.map((t) => (
                  <TxRow key={t.id} t={t} onEdit={() => openTx(t)} onDelete={() => remove(t)} />
                ))}
              </ul>
            </div>
          </section>
        ))
      )}
      <p className="muted small center">{catMeta('Other').emoji} Tip: press Ctrl+K and type “swiggy 450” to add instantly.</p>
    </>
  );
}
