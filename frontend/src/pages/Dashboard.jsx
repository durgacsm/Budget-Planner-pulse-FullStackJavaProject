import { useEffect, useMemo, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Flame, PiggyBank, Plus, Sparkles, Wallet } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import MonthNav from '../components/MonthNav';
import AnimatedNumber from '../components/AnimatedNumber';
import Ring from '../components/Ring';
import { analyse } from '../utils/insights';
import { catMeta } from '../utils/constants';
import {
  addMonths,
  fmt,
  fmtCompact,
  greeting,
  monthKey,
  monthLabel,
  monthRange,
  prettyDate,
} from '../utils/format';

const tipStyle = {
  background: 'var(--pop)',
  border: '1px solid var(--line)',
  borderRadius: 12,
  color: 'var(--text)',
  boxShadow: '0 12px 30px rgba(0,0,0,.25)',
};

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const { tick, openTx } = useOutletContext();
  const [month, setMonth] = useState(monthKey(new Date()));
  const [txns, setTxns] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [cuts, setCuts] = useState({});
  const [dayPick, setDayPick] = useState(null);

  useEffect(() => {
    let live = true;
    const from = monthRange(addMonths(month, -5)).from;
    const to = monthRange(month).to;
    Promise.all([api.getTransactions({ from, to }), api.getBudgets(month)])
      .then(([t, b]) => {
        if (!live) return;
        setTxns(t);
        setBudgets(b);
      })
      .catch((e) => toast.error(e.message));
    return () => {
      live = false;
    };
  }, [month, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => setDayPick(null), [month]);

  const d = useMemo(() => (txns ? analyse({ txns, budgets, month }) : null), [txns, budgets, month]);

  if (!d) {
    return (
      <>
        <div className="skeleton" style={{ height: 56, width: 320 }} />
        <div className="grid-3">
          {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 170 }} />)}
        </div>
      </>
    );
  }

  const first = user?.name?.split(' ')[0] || 'there';
  const recent = d.inMonth.slice(0, 6);
  const topCats = d.byCategory.slice(0, 5);
  const monthlyCut = topCats.reduce((s, c) => s + (c.value * (cuts[c.name] || 0)) / 100, 0);
  const trendData = d.trend.map((t) => ({ ...t, label: monthLabel(t.key, true) }));
  const barPct = Math.min(100, d.spentPct * 100);
  const over = d.basis > 0 && d.expense > d.basis;
  const scoreColor = d.score >= 80 ? ['#5CF2C0', '#4CC9F0'] : d.score >= 60 ? ['#5CF2C0', '#8B7CFF'] : d.score >= 40 ? ['#FFD166', '#FF7A59'] : ['#FF7A59', '#F72585'];

  let runwayNote = 'Set budgets to unlock your safe-to-spend number.';
  if (d.basis > 0) {
    if (!d.isCurrent) runwayNote = over ? `Went over by ${fmt(d.expense - d.basis)}.` : `Finished with ${fmt(d.basis - d.expense)} to spare.`;
    else if (d.timePct > 0) {
      const ratio = d.spentPct / d.timePct;
      runwayNote = ratio <= 0.9 ? 'You are pacing ahead of the month. Nice.' : ratio <= 1.05 ? 'Right on pace with the calendar.' : 'Spending is outrunning the calendar. Ease off a little.';
    }
  }

  const dayDetail =
    dayPick != null
      ? d.inMonth.filter((t) => t.type === 'EXPENSE' && Number(t.date.slice(8, 10)) === dayPick)
      : [];

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">{greeting()}, {first} 👋</p>
          <h1>Your money, at a glance</h1>
        </div>
        <MonthNav month={month} onChange={setMonth} />
      </header>

      {/* Hero row */}
      <section className="grid-hero">
        <article className="card spot hero-card rise" style={{ '--i': 0 }}>
          <div className="hero-top">
            <span className="pill"><Sparkles size={14} /> Safe to spend</span>
            {d.isCurrent && <span className="muted">{d.remaining} days left</span>}
          </div>
          {d.isCurrent && d.basis > 0 ? (
            <>
              <div className="hero-figure">
                <AnimatedNumber value={d.safePerDay} />
                <small>/ day</small>
              </div>
              <p className="muted">
                That keeps you inside {d.totalBudget > 0 ? 'your budgets' : 'an 80% income cap'} until {monthLabel(month, true)} ends.
              </p>
            </>
          ) : (
            <>
              <div className="hero-figure">
                <AnimatedNumber value={d.basis > 0 ? Math.abs(d.basis - d.expense) : d.expense} />
                <small>{d.basis > 0 ? (over ? 'over' : 'saved') : 'spent'}</small>
              </div>
              <p className="muted">{d.isCurrent ? 'Add income or budgets to see a daily allowance.' : `Final result for ${monthLabel(month)}.`}</p>
            </>
          )}

          <div className="runway" aria-label="Budget runway">
            <div className="runway-track">
              <div className={`runway-fill ${over ? 'over' : ''}`} style={{ width: `${barPct}%` }} />
              {d.isCurrent && <i className="runway-now" style={{ left: `${d.timePct * 100}%` }} title="Today" />}
            </div>
            <div className="runway-legend">
              <span>{fmt(d.expense)} spent</span>
              <span>{d.basis > 0 ? `of ${fmt(d.basis)}` : 'no budget set'}</span>
            </div>
          </div>
          <p className="runway-note">{runwayNote}</p>
        </article>

        <article className="card spot health-card rise" style={{ '--i': 1 }}>
          <h3>Money Health</h3>
          <Ring value={d.score} size={156} stroke={13} from={scoreColor[0]} to={scoreColor[1]}>
            <b className="ring-num"><AnimatedNumber value={d.score} format={(n) => Math.round(n)} /></b>
            <small>{d.label}</small>
          </Ring>
          <ul className="parts">
            <li><span>Saving</span><i><b style={{ width: `${(d.parts.saving / 40) * 100}%` }} /></i></li>
            <li><span>Budgets</span><i><b style={{ width: `${(d.parts.budgets / 30) * 100}%` }} /></i></li>
            <li><span>Pace</span><i><b style={{ width: `${(d.parts.pace / 30) * 100}%` }} /></i></li>
          </ul>
        </article>
      </section>

      {/* Summary */}
      <section className="grid-3">
        <article className="card spot stat rise" style={{ '--i': 2 }}>
          <span className="stat-icon good"><ArrowDownRight size={20} /></span>
          <p>Income</p>
          <strong><AnimatedNumber value={d.income} /></strong>
        </article>
        <article className="card spot stat rise" style={{ '--i': 3 }}>
          <span className="stat-icon bad"><ArrowUpRight size={20} /></span>
          <p>Expenses</p>
          <strong><AnimatedNumber value={d.expense} /></strong>
        </article>
        <article className="card spot stat rise" style={{ '--i': 4 }}>
          <span className="stat-icon violet"><PiggyBank size={20} /></span>
          <p>Savings <em className={d.savings >= 0 ? 'up' : 'down'}>{d.income > 0 ? `${Math.round(d.savingsRate * 100)}%` : ''}</em></p>
          <strong className={d.savings < 0 ? 'neg' : ''}><AnimatedNumber value={d.savings} /></strong>
        </article>
      </section>

      {d.alerts.length > 0 && (
        <section className="alerts rise" style={{ '--i': 5 }}>
          {d.alerts.slice(0, 3).map((a) => (
            <Link to="/budgets" key={a.id} className={`alert ${a.pct >= 1 ? 'danger' : 'warn'}`}>
              <AlertTriangle size={18} />
              <span>
                {catMeta(a.category).emoji} <b>{a.category}</b> {a.pct >= 1 ? `is over budget by ${fmt(a.spent - a.limit)}` : `has used ${Math.round(a.pct * 100)}% of its budget`}
              </span>
            </Link>
          ))}
        </section>
      )}

      {/* Charts */}
      <section className="grid-2">
        <article className="card spot rise" style={{ '--i': 6 }}>
          <div className="card-head"><h3>Last 6 months</h3>
            <div className="legend"><span className="dot g" />Income <span className="dot r" />Expenses</div>
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#5CF2C0" stopOpacity={0.5} />
                    <stop offset="1" stopColor="#5CF2C0" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#FF7A59" stopOpacity={0.45} />
                    <stop offset="1" stopColor="#FF7A59" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={fmtCompact} width={56} />
                <Tooltip contentStyle={tipStyle} formatter={(v, n) => [fmt(v), n]} />
                <Area type="monotone" dataKey="income" name="Income" stroke="#5CF2C0" strokeWidth={3} fill="url(#gi)" animationDuration={1200} />
                <Area type="monotone" dataKey="expense" name="Expenses" stroke="#FF7A59" strokeWidth={3} fill="url(#ge)" animationDuration={1400} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="card spot rise" style={{ '--i': 7 }}>
          <div className="card-head"><h3>Where it went</h3></div>
          {d.byCategory.length === 0 ? (
            <Empty text="No expenses this month yet." />
          ) : (
            <div className="donut-wrap">
              <div className="donut">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={d.byCategory} dataKey="value" nameKey="name" innerRadius="64%" outerRadius="92%" paddingAngle={3} cornerRadius={6} stroke="none" animationDuration={1100}>
                      {d.byCategory.map((c) => <Cell key={c.name} fill={catMeta(c.name).color} />)}
                    </Pie>
                    <Tooltip contentStyle={tipStyle} formatter={(v, n) => [fmt(v), n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-center"><small>Spent</small><b>{fmtCompact(d.expense)}</b></div>
              </div>
              <ul className="cat-list">
                {d.byCategory.slice(0, 6).map((c) => (
                  <li key={c.name}>
                    <span className="swatch" style={{ background: catMeta(c.name).color }} />
                    <span className="grow">{catMeta(c.name).emoji} {c.name}</span>
                    <b>{Math.round((c.value / d.expense) * 100)}%</b>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>
      </section>

      {/* Unique: heatmap + what-if */}
      <section className="grid-2">
        <article className="card spot rise" style={{ '--i': 8 }}>
          <div className="card-head">
            <h3>Spend heatmap</h3>
            <span className="pill warm"><Flame size={14} /> {d.streak}-day no-spend streak</span>
          </div>
          <div className="heat-days"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
          <div className="heat">
            {Array.from({ length: d.startOffset }).map((_, i) => <i key={`o${i}`} className="blank" />)}
            {d.daily.map((v, i) => {
              const lvl = v === 0 ? 0 : Math.min(4, Math.ceil((v / d.maxDaily) * 4));
              const future = d.isCurrent && i + 1 > d.elapsed;
              return (
                <button
                  key={i}
                  className={`cell l${lvl} ${future ? 'future' : ''} ${dayPick === i + 1 ? 'picked' : ''}`}
                  style={{ animationDelay: `${i * 18}ms` }}
                  title={`${i + 1} ${monthLabel(month, true)}: ${fmt(v)}`}
                  onClick={() => setDayPick(dayPick === i + 1 ? null : i + 1)}
                  disabled={future}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <p className="muted small">
            {d.noSpendDays} no-spend {d.noSpendDays === 1 ? 'day' : 'days'} this month. Tap a day to see what you bought.
          </p>
          {dayPick != null && (
            <div className="day-detail">
              <b>{dayPick} {monthLabel(month, true)}</b>
              {dayDetail.length === 0 ? <span className="muted">Nothing spent. 🎉</span> : dayDetail.map((t) => (
                <span key={t.id}>{catMeta(t.category).emoji} {t.description || t.category} · {fmt(t.amount)}</span>
              ))}
            </div>
          )}
        </article>

        <article className="card spot rise" style={{ '--i': 9 }}>
          <div className="card-head"><h3>What-if simulator</h3><span className="pill"><Wallet size={14} /> Try it</span></div>
          {topCats.length === 0 ? (
            <Empty text="Add some expenses to play with what-ifs." />
          ) : (
            <>
              <p className="muted small">Slide to cut spending in a category and see what it adds up to.</p>
              <div className="whatif">
                {topCats.map((c) => (
                  <label key={c.name} className="slider-row">
                    <span>{catMeta(c.name).emoji} {c.name}</span>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="5"
                      value={cuts[c.name] || 0}
                      style={{ '--p': `${((cuts[c.name] || 0) / 50) * 100}%`, '--c': catMeta(c.name).color }}
                      onChange={(e) => setCuts({ ...cuts, [c.name]: Number(e.target.value) })}
                    />
                    <b>-{cuts[c.name] || 0}%</b>
                  </label>
                ))}
              </div>
              <div className="whatif-result">
                <div><small>Per month</small><b><AnimatedNumber value={monthlyCut} duration={500} /></b></div>
                <div className="big"><small>Per year</small><b><AnimatedNumber value={monthlyCut * 12} duration={700} /></b></div>
              </div>
            </>
          )}
        </article>
      </section>

      {/* Recent */}
      <section className="card spot rise" style={{ '--i': 10 }}>
        <div className="card-head">
          <h3>Recent activity</h3>
          <Link to="/transactions" className="link">See all</Link>
        </div>
        {recent.length === 0 ? (
          <Empty text="Nothing here yet." action={<button className="btn btn-primary" onClick={() => openTx(null, 'EXPENSE')}><Plus size={16} /> Add your first transaction</button>} />
        ) : (
          <ul className="tx-list">
            {recent.map((t) => <TxRow key={t.id} t={t} />)}
          </ul>
        )}
      </section>
    </>
  );
}

export function TxRow({ t, onEdit, onDelete }) {
  const m = catMeta(t.category);
  return (
    <li className="tx" onClick={onEdit}>
      <span className="tx-ico" style={{ '--c': m.color }}>{m.emoji}</span>
      <div className="tx-main">
        <b>{t.description || t.category}</b>
        <small>{t.category} · {prettyDate(t.date)}</small>
      </div>
      <strong className={t.type === 'INCOME' ? 'pos' : ''}>{t.type === 'INCOME' ? '+' : '-'}{fmt(t.amount)}</strong>
      {onDelete && (
        <button
          className="icon-btn danger tx-del"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          aria-label="Delete"
        >✕</button>
      )}
    </li>
  );
}

export function Empty({ text, action }) {
  return (
    <div className="empty">
      <span className="empty-art">🪙</span>
      <p>{text}</p>
      {action}
    </div>
  );
}
