import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import Modal from './Modal';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { categoriesFor } from '../utils/constants';
import { toISO } from '../utils/format';

export default function TransactionModal({ txn, initialType = 'EXPENSE', onClose, onSaved }) {
  const toast = useToast();
  const editing = !!txn?.id;
  const [type, setType] = useState(txn?.type || initialType);
  const [amount, setAmount] = useState(txn?.amount ?? '');
  const [category, setCategory] = useState(txn?.category || categoriesFor(initialType)[0].name);
  const [date, setDate] = useState(txn?.date || toISO(new Date()));
  const [description, setDescription] = useState(txn?.description || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const amountRef = useRef(null);

  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  const switchType = (t) => {
    setType(t);
    if (!categoriesFor(t).some((c) => c.name === category)) setCategory(categoriesFor(t)[0].name);
  };

  const submit = async (e) => {
    e.preventDefault();
    const n = Number(amount);
    if (!n || n <= 0) return setError('Enter an amount greater than zero');
    if (!date) return setError('Pick a date');
    setError('');
    setSaving(true);
    try {
      const body = { type, amount: n, category, date, description: description.trim() };
      const saved = editing ? await api.updateTransaction(txn.id, body) : await api.createTransaction(body);
      toast.success(editing ? 'Transaction updated' : type === 'INCOME' ? 'Income added 🎉' : 'Expense added');
      onSaved?.(saved);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={editing ? 'Edit transaction' : 'New transaction'} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <div className="segmented" role="tablist">
          <span className={`seg-thumb ${type === 'INCOME' ? 'right' : ''}`} />
          <button type="button" className={type === 'EXPENSE' ? 'on' : ''} onClick={() => switchType('EXPENSE')}>
            Expense
          </button>
          <button type="button" className={type === 'INCOME' ? 'on' : ''} onClick={() => switchType('INCOME')}>
            Income
          </button>
        </div>

        <label className="big-amount">
          <span>₹</span>
          <input
            ref={amountRef}
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>

        <div className="field">
          <span className="label">Category</span>
          <div className="cat-grid">
            {categoriesFor(type).map((c) => (
              <button
                type="button"
                key={c.name}
                className={`cat-pill ${category === c.name ? 'on' : ''}`}
                style={{ '--c': c.color }}
                onClick={() => setCategory(c.name)}
              >
                <span>{c.emoji}</span>
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="row2">
          <label className="field">
            <span className="label">Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="field">
            <span className="label">Note</span>
            <input
              type="text"
              maxLength={80}
              placeholder="What was it for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
        </div>

        {error && <p className="form-error">{error}</p>}

        <button className="btn btn-primary btn-block" disabled={saving}>
          <Check size={18} /> {saving ? 'Saving…' : editing ? 'Save changes' : 'Add transaction'}
        </button>
      </form>
    </Modal>
  );
}
