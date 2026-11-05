import { useEffect, useRef } from 'react';

const GLYPHS = '#%&*+/<>=@$?';
const STEP_MS = 28; // each character settles this long after the one before it
const SPIN_MS = 260; // how long a character flickers before it settles

type Props = { text: string; play?: number; className?: string };

// Mono text that decodes left to right through random glyphs each time `play` changes. The settled text is what
// assistive tech reads; the flickering copy is aria-hidden.
export default function ScrambleText({ text, play = 0, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || play === 0 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = now - start;
      let done = true;
      el.textContent = [...text]
        .map((ch, i) => {
          if (ch === ' ' || t >= i * STEP_MS + SPIN_MS) return ch;
          done = false;
          return t < i * STEP_MS ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        })
        .join('');
      if (!done) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      el.textContent = text;
    };
    // Only `play` replays it: a new text remounts the keyed node and shows settled.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play]);

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      {/* Keyed so a new text remounts the node the effect writes to. */}
      <span key={text} ref={ref} aria-hidden="true">
        {text}
      </span>
    </span>
  );
}
