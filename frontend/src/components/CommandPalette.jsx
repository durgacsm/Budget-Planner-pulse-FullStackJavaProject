import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  CornerDownLeft,
  LayoutDashboard,
  LogOut,
  Moon,
  PiggyBank,
  Plus,
  Sparkles,
  Sun,
  Target,
} from 'lucide-react';
import { parseQuickAdd, catMeta } from '../utils/constants';
import { fmt } from '../utils/format';

export default function CommandPalette({ onClose, onNavigate, onNew, onQuickAdd, onTheme, onLogout, theme }) {
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => inputRef.current?.focus(), []);

  const quick = useMemo(() => parseQuickAdd(q), [q]);

  const items = useMemo(() => {
    const base = [
      { id: 'dash', label: 'Go to Dashboard', icon: LayoutDashboard, run: () => onNavigate('/') },
      { id: 'tx', label: 'Go to Transactions', icon: ArrowLeftRight, run: () => onNavigate('/transactions') },
      { id: 'bud', label: 'Go to Budgets', icon: PiggyBank, run: () => onNavigate('/budgets') },
      { id: 'goals', label: 'Go to Goals', icon: Target, run: () => onNavigate('/goals') },
      { id: 'exp', label: 'Add an expense', icon: Plus, run: () => onNew('EXPENSE') },
      { id: 'inc', label: 'Add income', icon: Plus, run: () => onNew('INCOME') },
      {
        id: 'theme',
        label: theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
        icon: theme === 'dark' ? Sun : Moon,
        run: onTheme,
      },
      { id: 'out', label: 'Sign out', icon: LogOut, run: onLogout },
    ];
    const needle = q.trim().toLowerCase();
    const filtered = needle && !quick ? base.filter((i) => i.label.toLowerCase().includes(needle)) : quick ? [] : base;
    if (quick) {
      const meta = catMeta(quick.category);
      return [
        {
          id: 'quick',
          label: `${quick.type === 'INCOME' ? 'Add income' : 'Add expense'} ${fmt(quick.amount)} · ${meta.emoji} ${quick.category}`,
          hint: quick.description,
          icon: Sparkles,
          accent: true,
          run: () => onQuickAdd(quick),
        },
      ];
    }
    return filtered;
  }, [q, quick, theme, onNavigate, onNew, onQuickAdd, onTheme, onLogout]);

  useEffect(() => setIdx(0), [q]);

  const onKey = (e) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIdx((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      items[idx]?.run();
      onClose();
    }
  };

  return (
    <div className="overlay overlay-top" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="palette" role="dialog" aria-label="Command palette">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKey}
          placeholder='Type a command, or quick-add: "swiggy 450" or "+50000 salary"'
        />
        <div className="palette-list">
          {items.length === 0 && <p className="muted pad">No matches</p>}
          {items.map((it, i) => (
            <button
              key={it.id}
              className={`palette-item ${i === idx ? 'on' : ''} ${it.accent ? 'accent' : ''}`}
              onMouseEnter={() => setIdx(i)}
              onClick={() => {
                it.run();
                onClose();
              }}
            >
              <it.icon size={18} />
              <span>{it.label}</span>
              {it.hint && <em>{it.hint}</em>}
              {i === idx && <CornerDownLeft size={14} className="enter" />}
            </button>
          ))}
        </div>
        <div className="palette-foot">
          <kbd>↑↓</kbd> move <kbd>Enter</kbd> run <kbd>Esc</kbd> close
        </div>
      </div>
    </div>
  );
}
