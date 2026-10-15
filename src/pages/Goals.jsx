import { useEffect, useState } from 'react';
import { CalendarClock, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import Ring from '../components/Ring';
import AnimatedNumber from '../components/AnimatedNumber';
import { fireConfetti } from '../components/Confetti';
import { Empty } from './Dashboard';
import { fmt, monthKey, parseISO } from '../utils/format';

const EMOJIS = ['🎯', '✈️', '🏠', '🚗', '💻', '📱', '🎓', '💍', '🛡️', '🏝️', '🎸', '🐶'];

// Goals are stored in the browser per user. (The Spring Boot API in the README has no goals endpoint yet.)
const keyFor = (u) => `bp_goals_${u?.email || 'guest'}`;

const monthsLeft = (iso) => {
  if (!iso) return null;
  const d = parseISO(iso);
  const n = new Date();
  return Math.max(1, (d.getFullYear() - n.getFullYear()) * 12 + d.getMonth() - n.getMonth());
};

export default function Goals() {
  const { user } = useAuth();
  const toast = useToast();
  const [goals, setGoals] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(keyFor(user))) || null;
    } catch {
      return null;
    }
  });
  const [modal, setModal] = useState(false);
  const [custom, setCustom] = useState({});

  // First visit: seed two example goals so the page isn't empty.
  useEffect(() => {
    if (goals === null) {
      const n = new Date();
      setGoals([
        { id: 1, name: 'Goa trip', emoji: '🏝️', target: 40000, saved: 26500, deadline: `${n.getFullYear() + (n.getMonth() > 8 ? 1 : 0)}-${String(((n.getMonth() + 4) % 12) + 1).padStart(2, '0')}-15` },
        { id: 2, name: 'Emergency fund', emoji: '🛡️', target: 150000, saved: 48000, deadline: '' },
      ]);
    }
  }, [goals]);

  useEffect(() => {
    if (goals) localStorage.setItem(keyFor(user), JSON.stringify(goals));
  }, [goals, user]);

  const add = (e, id, amt) => {
    const n = Number(amt);
    if (!n || n <= 0) return;
    setGoals((gs) =>
      gs.map((g) => {
        if (g.id !== id) return g;
        const saved = g.saved + n;
        if (g.saved < g.target && saved >= g.target) {
          const r = e?.currentTarget?.getBoundingClientRect?.();
          fireConfetti(r ? { x: r.left + r.width / 2, y: r.top } : null);
          toast.success(`🎉 Goal reached: ${g.name}!`);
        }
        return { ...g, saved };
      })
    );
    setCustom((c) => ({ ...c, [id]: '' }));
  };

  const remove = (id) => {
    if (window.confirm('Delete this goal?')) setGoals((gs) => gs.filter((g) => g.id !== id));
  };

  const list = goals || [];
  const totalSaved = list.reduce((s, g) => s + g.saved, 0);
  const totalTarget = list.reduce((s, g) => s + g.target, 0);

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Dream it, then fill it</p>
          <h1>Savings goals</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={16} /> New goal</button>
      </header>

      {list.length > 0 && (
        <section className="card spot budget-hero rise">
          <div><p className="muted">Saved across goals</p><strong className="bigfig pos"><AnimatedNumber value={totalSaved} /></strong></div>
          <div><p className="muted">Total targets</p><strong className="bigfig"><AnimatedNumber value={totalTarget} /></strong></div>
          <div><p className="muted">Overall</p><strong className="bigfig"><AnimatedNumber value={totalTarget ? (totalSaved / totalTarget) * 100 : 0} format={(n) => `${Math.round(n)}%`} /></strong></div>
        </section>
      )}

      {list.length === 0 && <section className="card"><Empty text="No goals yet. Start with something you're excited about." /></section>}

      <section className="goal-grid">
        {list.map((g, i) => {
          const pct = Math.min(100, (g.saved / g.target) * 100);
          const done = g.saved >= g.target;
          const m = monthsLeft(g.deadline);
          const perMonth = m && !done ? Math.ceil((g.target - g.saved) / m) : null;
          return (
            <article key={g.id} className={`card spot goal rise ${done ? 'done' : ''}`} style={{ '--i': Math.min(i, 8) }}>
              <button className="icon-btn danger goal-del" onClick={() => remove(g.id)} aria-label="Delete goal"><Trash2 size={16} /></button>
              <Ring value={pct} size={132} stroke={11} from={done ? '#FFD166' : '#5CF2C0'} to={done ? '#FF7A59' : '#8B7CFF'}>
                <span className="goal-emoji">{g.emoji}</span>
                <b>{Math.round(pct)}%</b>
              </Ring>
              <h3>{g.name}</h3>
              <p className="muted">{fmt(g.saved)} of {fmt(g.target)}</p>
              {g.deadline && (
                <p className="goal-meta"><CalendarClock size={14} /> {parseISO(g.deadline).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  {perMonth ? ` · save ${fmt(perMonth)}/mo` : ''}</p>
              )}
              {done ? (
                <p className="goal-done">🏆 Goal complete!</p>
              ) : (
                <>
                  <div className="quick">
                    {[500, 1000, 5000].map((a) => (
                      <button key={a} className="chip" onClick={(e) => add(e, g.id, a)}>+{fmt(a)}</button>
                    ))}
                  </div>
                  <form className="inline-edit" onSubmit={(e) => { e.preventDefault(); add(e, g.id, custom[g.id]); }}>
                    <span>₹</span>
                    <input type="number" min="1" placeholder="Custom" value={custom[g.id] || ''} onChange={(e) => setCustom({ ...custom, [g.id]: e.target.value })} />
                    <button className="btn btn-primary btn-sm" type="submit">Add</button>
                  </form>
                </>
              )}
            </article>
          );
        })}
      </section>

      {modal && (
        <GoalModal
          onClose={() => setModal(false)}
          onCreate={(g) => {
            setGoals((gs) => [...(gs || []), { ...g, id: Date.now(), saved: 0 }]);
            toast.success('Goal created');
            setModal(false);
          }}
        />
      )}
    </>
  );
}

function GoalModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [err, setErr] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (name.trim().length < 2) return setErr('Give your goal a name');
    if (!Number(target) || Number(target) <= 0) return setErr('Enter a target amount');
    if (deadline && deadline.slice(0, 7) < monthKey(new Date())) return setErr('Deadline should be in the future');
    onCreate({ name: name.trim(), emoji, target: Number(target), deadline });
  };

  return (
    <Modal title="New savings goal" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <div className="emoji-row">
          {EMOJIS.map((e) => (
            <button type="button" key={e} className={`emoji ${emoji === e ? 'on' : ''}`} onClick={() => setEmoji(e)}>{e}</button>
          ))}
        </div>
        <label className="field"><span className="label">Name</span>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New laptop" maxLength={40} /></label>
        <div className="row2">
          <label className="field"><span className="label">Target (₹)</span>
            <input type="number" min="1" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="50000" /></label>
          <label className="field"><span className="label">Deadline (optional)</span>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></label>
        </div>
        {err && <p className="form-error">{err}</p>}
        <button className="btn btn-primary btn-block">Create goal</button>
      </form>
    </Modal>
  );
}
