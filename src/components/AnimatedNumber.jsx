import { useEffect, useRef, useState } from 'react';
import { fmt } from '../utils/format';

// Counts smoothly from the previous value to the new one.
export default function AnimatedNumber({ value, format = fmt, duration = 900 }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    const b = Number(value) || 0;
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      const v = a + (b - a) * eased;
      from.current = v;
      setShown(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className="num">{format(shown)}</span>;
}
