import { useEffect, useRef } from 'react';

// A sphere of dots on a canvas: graphite dots, lit ones turn amber (the hologram's palette).
// Runs only while `active`. "idle" turns slowly with a drifting glint; "think" spins faster with a scan band.
// Idea from the dotted orb in "ai-thinking-orb-and-input"; rewritten small for this site.

type Mode = 'idle' | 'think';
type Props = { size: number; mode: Mode; active?: boolean; className?: string };

const RINGS = 12;
const TAU = Math.PI * 2;
const DOTS = (() => {
  const out: [number, number, number][] = [];
  for (let k = 0; k < RINGS; k++) {
    const y = 1 - ((k + 0.5) / RINGS) * 2;
    const r = Math.sqrt(1 - y * y);
    const m = Math.max(4, Math.round(24 * r));
    for (let j = 0; j < m; j++) {
      const a = (j / m) * TAU + k * 0.35;
      out.push([Math.cos(a) * r, y, Math.sin(a) * r]);
    }
  }
  return out;
})();
const TILT_C = Math.cos(0.35);
const TILT_S = Math.sin(0.35);

export default function DotOrb({ size, mode, active = true, className = '' }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !active) return;
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const c = size / 2;
    const R = size * 0.42;
    let yaw = 0;
    let spin = 0.4;
    let think = 0; // eases 0..1 so the switch between modes is smooth
    let time = 1.2;
    let last = performance.now();
    let raf = 0;

    const draw = (dt: number) => {
      const target = modeRef.current === 'think' ? 1 : 0;
      think += (target - think) * Math.min(1, dt * 4);
      spin = 0.4 + think * 1.4;
      yaw += spin * dt;
      time += dt;
      ctx.clearRect(0, 0, size, size);
      const cy = Math.cos(yaw), sy = Math.sin(yaw);
      // Idle glint: a light direction drifting around the sphere. Think: a band sweeping up and down.
      const la = time * 0.7, lb = Math.sin(time * 0.5) * 0.8;
      const lx = Math.cos(lb) * Math.cos(la), ly = Math.sin(lb), lz = Math.cos(lb) * Math.sin(la);
      const band = Math.sin(time * 2.4);
      for (let pass = 0; pass < 2; pass++) {
        for (const [dx, dy, dz] of DOTS) {
          const x1 = dx * cy + dz * sy, z1 = -dx * sy + dz * cy;
          const y2 = dy * TILT_C - z1 * TILT_S, z2 = dy * TILT_S + z1 * TILT_C;
          const depth = (z2 + 1) / 2;
          if ((depth >= 0.5) !== (pass === 1)) continue; // back half first
          const glint = Math.max(0, (dx * lx + dy * ly + dz * lz - 0.75) / 0.25);
          const scan = Math.exp(-((dy - band) ** 2) / 0.02);
          const lit = Math.min(1, glint * glint * (1 - think) + scan * think);
          const f = 2.8 / (2.8 - z2);
          const a = Math.min(1, 0.12 + 0.5 * depth * depth + 0.6 * lit);
          ctx.fillStyle = lit > 0.2 ? `rgba(196,106,0,${a.toFixed(3)})` : `rgba(20,18,15,${a.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(c + x1 * R * f, c - y2 * R * f, size * (0.011 + 0.014 * depth + 0.01 * lit) * f, 0, TAU);
          ctx.fill();
        }
      }
    };

    const frame = (now: number) => {
      draw(Math.min(0.05, (now - last) / 1000));
      last = now;
      raf = requestAnimationFrame(frame);
    };
    if (reduced) draw(0);
    else raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [size, active]);

  return <canvas ref={ref} aria-hidden="true" className={className} style={{ width: size, height: size }} />;
}
