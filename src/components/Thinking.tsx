import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useMessages, useT } from '../i18n';
import { isGuided } from '../lib/scroll';

export type GenState = 'idle' | 'thinking' | 'done';
type Block = 'hero' | 'retrieval' | 'generate' | 'output';

// Revealed in order once a block is done: its direct children, or the children of [data-stream] wrappers.
const STREAM = ':scope > :not(.thinking):not([data-stream]), :scope [data-stream] > :not([data-stream])';

// A block "generates" like a chat answer: it thinks for `ms` once it scrolls into view (and `when`
// allows it), then its content streams in. The content is in the HTML the whole time, only faded,
// so no-JS readers, crawlers and screen readers get it; reduced motion skips straight to done.
// For whole-screen sections that settle at the top: start once their top is in the upper 30% of the screen.
export const SETTLED = '0px 0px -70% 0px';
// A block must stay on screen this long before it thinks, so a link jump or a fast scroll that only passes
// through it never leaves its (often fixed, centred) thinking card over another section.
const SETTLE_MS = 180;

// `margin` is the IntersectionObserver rootMargin: whole-screen sections wait until they reach the top.
export function useGenerate<T extends HTMLElement>(ms: number, when = true, margin = '0px 0px -20% 0px') {
  const ref = useRef<T>(null);
  const [state, setState] = useState<GenState>('idle');
  const whenRef = useRef(when);
  const tryRef = useRef(() => {});

  useEffect(() => {
    const el = ref.current!;
    const html = document.documentElement;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return setState('done');
    let inView = false;
    let started = false;
    let timer = 0;
    let settle = 0;

    // instant: the block was left mid-thought or landed on by focus; it shows at once, with no card fading over it.
    const finish = (instant = false) => {
      clearTimeout(timer);
      clearTimeout(settle);
      if (instant) el.setAttribute('data-gen-instant', '');
      el.querySelectorAll<HTMLElement>(STREAM).forEach((n, i) => n.style.setProperty('--i', String(i)));
      setState('done');
      stop();
    };
    // The welcome loader covers the page; thinking starts once it has lifted.
    const ready = () => !started && inView && whenRef.current && !html.hasAttribute('data-welcome');
    const tryStart = () => {
      if (!ready()) return;
      clearTimeout(settle);
      settle = window.setTimeout(() => {
        // Re-check where it really is: an observer update can lag behind a fast jump.
        const r = el.getBoundingClientRect();
        if (r.bottom <= 0 || r.top >= innerHeight) inView = false;
        if (!ready()) return;
        // Already well past its start (a fast scroll to the footer, say): show it, don't think over what follows.
        if (r.top < -innerHeight * 0.5) return finish(true);
        if (isGuided()) return tryStart(); // a link is still scrolling the page past it
        started = true;
        frame = requestAnimationFrame(watch);
        setState('thinking');
        timer = window.setTimeout(() => finish(), ms);
      }, SETTLE_MS);
    };
    tryRef.current = tryStart;

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (!inView && started) return finish(true);
        tryStart();
      },
      { rootMargin: margin },
    );
    const welcome = new MutationObserver(tryStart);
    // Keyboard users never tab into faded content: focusing inside finishes the block at once.
    const onFocus = () => finish(true);
    // While thinking, check every frame (smooth scrolling moves the page inside its own animation frame, before
    // the scroll event and the observer catch up): once the block is off screen, or well past its start, it ends
    // in that same frame, so its card is never painted over another section.
    let frame = 0;
    const watch = () => {
      const r = el.getBoundingClientRect();
      if (r.bottom <= 0 || r.top >= innerHeight || r.top < -innerHeight * 0.5) return finish(true);
      frame = requestAnimationFrame(watch);
    };
    const stop = () => {
      io.disconnect();
      welcome.disconnect();
      el.removeEventListener('focusin', onFocus);
      cancelAnimationFrame(frame);
      tryRef.current = () => {};
    };
    io.observe(el);
    welcome.observe(html, { attributes: true, attributeFilter: ['data-welcome'] });
    el.addEventListener('focusin', onFocus);
    return () => {
      clearTimeout(timer);
      clearTimeout(settle);
      stop();
    };
  }, [ms, margin]);

  useEffect(() => {
    whenRef.current = when;
    tryRef.current();
  }, [when]);

  return { ref, state };
}

// The "thinking" status shown in place of a block until it is done. Decorative: the real content is already in the DOM.
export default function Thinking({ block, ms, center = false }: { block: Block; ms: number; center?: boolean }) {
  const t = useT();
  const steps = useMessages().thinking[block];
  return (
    <div className="thinking" data-center={center || undefined} aria-hidden="true" style={{ '--ms': `${ms}ms`, '--n': steps.length } as CSSProperties}>
      <div className="thinking-card">
        <p className="thinking-head">
          <span className="thinking-dot" />
          <span className="thinking-label">{t('thinking.label')}…</span>
        </p>
        <ol className="thinking-steps">
          {steps.map((s, k) => (
            <li key={s} style={{ '--k': k } as CSSProperties}>{s}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
