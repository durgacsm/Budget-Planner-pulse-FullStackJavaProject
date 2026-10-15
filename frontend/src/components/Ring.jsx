import { useEffect, useId, useState } from 'react';

// Animated progress ring. value is 0-100.
export default function Ring({ value = 0, size = 150, stroke = 12, from = '#5CF2C0', to = '#8B7CFF', children }) {
  const id = useId().replace(/:/g, '');
  const [v, setV] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setV(Math.max(0, Math.min(100, value))), 80);
    return () => clearTimeout(t);
  }, [value]);

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={from} />
            <stop offset="1" stopColor={to} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-track" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * v) / 100}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="ring-bar"
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}
