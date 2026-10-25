import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useMessages, useT } from '../i18n';

export type GenState = 'idle' | 'thinking' | 'done';
type Block = 'hero' | 'retrieval' | 'generate' | 'output';

// Revealed in order once a block is done: its direct children, or the children of [data-stream] wrappers.
const STREAM = ':scope > :not(.thinking):not([data-stream]), :scope [data-stream] > :not([data-stream])';

// A block "generates" like a chat answer: it thinks for `ms` once it scrolls into view (and `when`
// allows it), then its content streams in. The content is in the HTML the whole time, only faded,
// so no-JS readers, crawlers and screen readers get it; reduced motion skips straight to done.
// For whole-screen sections that settle at the top: start once their top is in the upper 30% of the screen.
export const SETTLED = '0px 0px -70% 0px';

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

    const finish = () => {
      clearTimeout(timer);
      el.querySelectorAll<HTMLElement>(STREAM).forEach((n, i) => n.style.setProperty('--i', String(i)));
      setState('done');
      stop();
    };
    const tryStart = () => {
      // The welcome loader covers the page; thinking starts once it has lifted.
      if (started || !inView || !whenRef.current || html.hasAttribute('data-welcome')) return;
      started = true;
      setState('thinking');
      timer = window.setTimeout(finish, ms);
    };
    tryRef.current = tryStart;

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        tryStart();
      },
      { rootMargin: margin },
    );
    const welcome = new MutationObserver(tryStart);
    // Keyboard users never tab into faded content: focusing inside finishes the block at once.
    const onFocus = () => finish();
    const stop = () => {
      io.disconnect();
      welcome.disconnect();
      el.removeEventListener('focusin', onFocus);
      tryRef.current = () => {};
    };
    io.observe(el);
    welcome.observe(html, { attributes: true, attributeFilter: ['data-welcome'] });
    el.addEventListener('focusin', onFocus);
    return () => {
      clearTimeout(timer);
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
