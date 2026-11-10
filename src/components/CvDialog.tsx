import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Download } from 'lucide-react';
import profile from '../content/profile.json';
import { useLocale, useMessages, useT } from '../i18n';
import { overlayBack, overlayPush } from '../lib/overlayHistory';
import { focusTarget, scrollToElement, setScrollLock } from '../lib/scroll';
import { Guides } from './Background';
import CaseMenuButton from './CaseMenuButton';
import BlurReveal from './ui/BlurReveal';

// Same curtain as the project cases (.case-* in global.css), same stage names and timing as Generate.tsx.
type Stage = 'closed' | 'in' | 'shown' | 'open' | 'out' | 'gone';
const STEP_MS = 520;

// functions/api/count.ts; the GitHub Pages mirror has no functions, so it posts to the Cloudflare site. text/plain avoids a CORS preflight.
const countUrl = () => (location.hostname.endsWith('github.io') ? new URL('api/count', profile.siteUrl).href : '/api/count');
const count = (event: 'view' | 'get', lang: string) => {
  try {
    navigator.sendBeacon(countUrl(), new Blob([JSON.stringify({ event, lang })], { type: 'text/plain' }));
  } catch {
    // Counting never blocks the CV.
  }
};

const MONO_LINK = 'ink-auto inline-flex min-h-11 w-fit items-center gap-2 font-mono text-xs uppercase tracking-[0.06em] underline-offset-4 hover:underline';

export default function CvDialog() {
  const t = useT();
  const locale = useLocale();
  const o = useMessages().output;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const timers = useRef<number[]>([]);
  const [stage, setStage] = useState<Stage>('closed');
  // The dev server and some hosts answer a missing file with the site itself, so check it is really a PDF.
  const [ready, setReady] = useState(true);

  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const open = () => {
    count('view', locale);
    fetch(o.cvFile, { method: 'HEAD' })
      .then((r) => setReady(r.ok && (r.headers.get('content-type') ?? '').includes('pdf')))
      .catch(() => setReady(false));
    openerRef.current = document.activeElement as HTMLElement | null;
    setScrollLock(true);
    overlayPush();
    dialogRef.current?.showModal();
    if (reduce()) return setStage('open');
    setStage('in');
    later(STEP_MS, () => setStage('shown'));
    later(STEP_MS * 2, () => setStage('open'));
  };

  const close = (after?: () => void) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const finish = () => {
      dialogRef.current?.close();
      setScrollLock(false);
      setStage('closed');
      openerRef.current?.focus();
      after?.();
    };
    if (reduce()) return finish();
    setStage('out');
    later(STEP_MS, () => setStage('gone'));
    later(STEP_MS * 2, finish);
  };

  useEffect(() => {
    if (stage === 'open') backRef.current?.focus();
  }, [stage]);

  // Escape runs the animated close instead of the dialog's instant one.
  useEffect(() => {
    const d = dialogRef.current!;
    const onCancel = (e: Event) => {
      e.preventDefault();
      if (stage === 'open') overlayBack(close);
    };
    const onPop = () => {
      if (stage !== 'closed' && stage !== 'out' && stage !== 'gone') close();
    };
    // A section picked in the menu: the overlay closes (dropping its history entry) and the page lands on it.
    const onNav = (e: Event) => {
      if (stage === 'closed') return;
      const id = (e as CustomEvent<string>).detail;
      history.replaceState(null, '');
      close(() => {
        const el = document.getElementById(id);
        if (el) scrollToElement(el, true);
        focusTarget(id);
      });
    };
    d.addEventListener('cancel', onCancel);
    window.addEventListener('popstate', onPop);
    window.addEventListener('overlay:close', onNav);
    return () => {
      d.removeEventListener('cancel', onCancel);
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('overlay:close', onNav);
    };
  });

  return (
    <>
      <button type="button" onClick={open} className={`${MONO_LINK} -mt-2 cursor-pointer`}>
        {o.cvLink}
        <ArrowUpRight className="size-3.5" aria-hidden="true" strokeWidth={1.75} />
      </button>

      <dialog ref={dialogRef} aria-labelledby="cv-title" className="case-dialog" data-stage={stage} data-lenis-prevent>
        <div className="case-curtain case-curtain-ink" aria-hidden="true" />
        <div className="case-curtain case-curtain-amber" aria-hidden="true" />
        <div className="case-page">
          <button ref={backRef} type="button" onClick={() => overlayBack(close)} disabled={stage !== 'open'} className="case-back">
            <ArrowLeft className="size-4" aria-hidden="true" strokeWidth={1.75} />
            {t('generate.back')}
          </button>
          <CaseMenuButton />
          <div aria-hidden="true" className="case-mast masthead-blur">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div aria-hidden="true" className="case-guides">
            <Guides />
          </div>
          <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-32 sm:px-8 md:pt-40">
            <h2 id="cv-title" className="relative max-w-4xl text-3xl leading-[1.05] font-[var(--font-weight-display)] tracking-[var(--tracking-display)]">
              <BlurReveal as="span" inView>{o.cvTitle}</BlurReveal>
            </h2>
            {ready ? (
              <>
              <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-2">
                <a href={o.cvDownload} download onClick={() => count('get', locale)} className="flex h-12 items-center gap-2 rounded-2xl bg-accent-fill px-5 text-lg font-medium text-accent-ink transition-transform duration-200 active:scale-95">
                  <Download className="size-5" aria-hidden="true" strokeWidth={2} />
                  {o.cvGet}
                </a>
              </div>
              <iframe
                src={`${o.cvFile}#toolbar=0&navpanes=0`}
                title={o.cvTitle}
                loading="lazy"
                className="mt-10 h-[80dvh] w-full rounded-panel border border-line bg-surface"
              />
              </>
            ) : (
              <p className="mt-8 max-w-[46ch] text-muted">{o.cvMissing}</p>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
