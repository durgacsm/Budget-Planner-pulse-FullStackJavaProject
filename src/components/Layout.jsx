import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  Command,
  LayoutDashboard,
  LogOut,
  Moon,
  PiggyBank,
  Plus,
  Sun,
  Target,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api';
import { toISO } from '../utils/format';
import TransactionModal from './TransactionModal';
import CommandPalette from './CommandPalette';
import Confetti from './Confetti';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/budgets', label: 'Budgets', icon: PiggyBank },
  { to: '/goals', label: 'Goals', icon: Target },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [txModal, setTxModal] = useState(null); // { txn?, type? }
  const [palette, setPalette] = useState(false);
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const openTx = useCallback((txn, type) => setTxModal({ txn, type }), []);

  // Ctrl/Cmd + K opens the command palette.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Cursor-follow glow on any element with the "spot" class.
  useEffect(() => {
    const onMove = (e) => {
      const el = e.target.closest?.('.spot');
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    document.addEventListener('mousemove', onMove);
    return () => document.removeEventListener('mousemove', onMove);
  }, []);

  const quickAdd = async (draft) => {
    try {
      await api.createTransaction({ ...draft, date: toISO(new Date()) });
      toast.success(`Added ${draft.description}`);
      refresh();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const initials = (user?.name || '?')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="shell">
      <div className="aurora" aria-hidden="true">
        <i /><i /><i />
      </div>

      <aside className="sidebar">
        <div className="brand">
          <span className="logo">
            <svg viewBox="0 0 64 64" width="26" height="26" aria-hidden="true">
              <path d="M8 38h10l7-18 9 28 7-20 4 10h11" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div>
            <strong>Pulse</strong>
            <small>Budget Planner</small>
          </div>
        </div>

        <nav className="nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <n.icon size={20} />
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="palette-trigger" onClick={() => setPalette(true)}>
          <Command size={16} />
          <span>Quick actions</span>
          <kbd>Ctrl K</kbd>
        </button>

        <div className="side-foot">
          <div className="me">
            <span className="avatar">{initials}</span>
            <div>
              <strong>{user?.name}</strong>
              <small>{user?.email}</small>
            </div>
          </div>
          <div className="side-actions">
            <button className="icon-btn" onClick={toggle} aria-label="Toggle theme" title="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="icon-btn" onClick={logout} aria-label="Sign out" title="Sign out">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        <div key={location.pathname} className="page">
          <Outlet context={{ openTx, tick, refresh }} />
        </div>
      </main>

      <nav className="tabbar" aria-label="Primary">
        {NAV.slice(0, 2).map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>
            <n.icon size={22} />
            <span>{n.label}</span>
          </NavLink>
        ))}
        <button className="tab-fab" onClick={() => openTx(null, 'EXPENSE')} aria-label="Add transaction">
          <Plus size={26} />
        </button>
        {NAV.slice(2).map((n) => (
          <NavLink key={n.to} to={n.to} className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>
            <n.icon size={22} />
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>

      <button className="fab" onClick={() => openTx(null, 'EXPENSE')} aria-label="Add transaction">
        <Plus size={22} /> <span>Add</span>
      </button>

      {txModal && (
        <TransactionModal
          txn={txModal.txn}
          initialType={txModal.type || 'EXPENSE'}
          onClose={() => setTxModal(null)}
          onSaved={refresh}
        />
      )}
      {palette && (
        <CommandPalette
          theme={theme}
          onClose={() => setPalette(false)}
          onNavigate={navigate}
          onNew={(t) => openTx(null, t)}
          onQuickAdd={quickAdd}
          onTheme={toggle}
          onLogout={logout}
        />
      )}
      <Confetti />
    </div>
  );
}
