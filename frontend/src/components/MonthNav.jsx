import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, monthKey, monthLabel } from '../utils/format';

export default function MonthNav({ month, onChange }) {
  const current = monthKey(new Date());
  return (
    <div className="month-nav">
      <button className="icon-btn" onClick={() => onChange(addMonths(month, -1))} aria-label="Previous month">
        <ChevronLeft size={18} />
      </button>
      <span key={month} className="month-label">
        {monthLabel(month)}
      </span>
      <button className="icon-btn" onClick={() => onChange(addMonths(month, 1))} aria-label="Next month">
        <ChevronRight size={18} />
      </button>
      {month !== current && (
        <button className="chip" onClick={() => onChange(current)}>
          Today
        </button>
      )}
    </div>
  );
}
