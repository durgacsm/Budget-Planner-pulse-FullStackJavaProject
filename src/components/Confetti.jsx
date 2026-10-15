import { useEffect, useRef } from 'react';

export const fireConfetti = (origin) =>
  window.dispatchEvent(new CustomEvent('bp:confetti', { detail: origin || null }));

const COLORS = ['#5CF2C0', '#8B7CFF', '#FFD166', '#FF7A59', '#4CC9F0', '#F72585'];

// A single full-screen canvas, mounted once in Layout.
export default function Confetti() {
  const ref = useRef(null);
  const parts = useRef([]);
  const raf = useRef(0);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      parts.current = parts.current.filter((p) => p.life > 0 && p.y < canvas.height + 20);
      parts.current.forEach((p) => {
        p.vy += 0.18;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= 1;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.min(1, p.life / 30);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      });
      if (parts.current.length) raf.current = requestAnimationFrame(loop);
      else raf.current = 0;
    };

    const burst = (e) => {
      const o = e.detail || { x: window.innerWidth / 2, y: window.innerHeight / 3 };
      for (let i = 0; i < 120; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 4 + Math.random() * 9;
        parts.current.push({
          x: o.x,
          y: o.y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - 5,
          size: 6 + Math.random() * 8,
          rot: Math.random() * 6,
          vr: (Math.random() - 0.5) * 0.4,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          life: 90 + Math.random() * 70,
        });
      }
      if (!raf.current) raf.current = requestAnimationFrame(loop);
    };

    window.addEventListener('bp:confetti', burst);
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('bp:confetti', burst);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return <canvas ref={ref} className="confetti" aria-hidden="true" />;
}
