import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useActiveStage } from '../hooks/useActiveStage';
import { useT } from '../i18n';
import { STAGES } from '../lib/stages';

// Top-center status pill, styled like a model's status line: "Generating · 03/05 Rerank" and a bar
// for how far down the page you are. While a block is thinking it says so. Opens a list of stages to jump to.
export default function ProgressPill() {
  const t = useT();
  const active = useActiveStage();
  const activeIndex = STAGES.indexOf(active);
  const [open, setOpen] = useState(false);
  const [thinking, setThinking] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  // Page progress goes straight to the bar's transform: no re-render per scroll frame.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - innerHeight;
      barRef.current?.style.setProperty('--p', String(max > 0 ? Math.min(1, scrollY / max) : 1));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    update();
    return () => {
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Any block in its thinking phase (components/Thinking.tsx) turns the label into "Thinking…".
  useEffect(() => {
    const check = () => setThinking(!!document.querySelector('[data-gen="thinking"]'));
    const mo = new MutationObserver(check);
    mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-gen'] });
    check();
    return () => mo.disconnect();
  }, []);

  // Outside click or Escape closes the list; Escape returns focus to the pill.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      rootRef.current?.querySelector('button')?.focus();
    };
    addEventListener('pointerdown', onDown);
    addEventListener('keydown', onKey);
    return () => {
      removeEventListener('pointerdown', onDown);
      removeEventListener('keydown', onKey);
    };
  }, [open]);

  const name = t(`stages.${active}`);
  const n = (i: number) => String(i + 1).padStart(2, '0');

  return (
    <nav ref={rootRef} aria-label={t('progress.nav')} className="progress-pill no-js-hide">
      <button type="button" aria-expanded={open} aria-controls="progress-list" onClick={() => setOpen((o) => !o)} className="glass progress-button">
        <span className="thinking-dot" data-still={!thinking || undefined} aria-hidden="true" />
        <span className={`progress-status max-sm:hidden ${thinking ? 'thinking-label' : ''}`}>{thinking ? `${t('thinking.label')}…` : t('progress.generating')}</span>
        <span className="font-mono text-[0.8125rem] tabular-nums text-muted" aria-hidden="true">
          {n(activeIndex)}/{n(STAGES.length - 1)}
        </span>
        <span className="min-w-0 truncate font-medium">
          <span className="sr-only">{t('progress.current')}: </span>
          {name}
        </span>
        <span className="progress-track max-sm:hidden" aria-hidden="true">
          <span ref={barRef} className="progress-fill" />
        </span>
        <ChevronDown className={`size-4 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true" strokeWidth={1.75} />
      </button>
      <ol id="progress-list" hidden={!open} className="glass progress-list">
        {STAGES.map((stage, i) => {
          const done = i < activeIndex;
          return (
            <li key={stage}>
              <a
                href={`#${stage}`}
                aria-current={stage === active ? 'step' : undefined}
                onClick={() => setOpen(false)}
                className="progress-item"
              >
                <span className="grid size-4 place-items-center" aria-hidden="true">
                  {done ? <Check className="size-3.5" strokeWidth={2} /> : <span className={`size-2 rounded-full ${stage === active ? 'bg-accent-fill' : 'border border-line-strong'}`} />}
                </span>
                <span className="font-mono text-[0.8125rem] tabular-nums">{n(i)}</span>
                {t(`stages.${stage}`)}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
