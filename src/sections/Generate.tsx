import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Play } from 'lucide-react';
import { Guides } from '../components/Background';
import Diagram from '../components/Diagram';
import CaseMenuButton from '../components/CaseMenuButton';
import BlurReveal from '../components/ui/BlurReveal';
import Row from '../components/ui/Row';
import StackInteractor from '../components/ui/StackInteractor';
import profile from '../content/profile.json';
import { useMessages, useT } from '../i18n';
import { featured, type Project } from '../lib/projects';
import { overlayBack, overlayPush } from '../lib/overlayHistory';
import { focusTarget, scrollToElement, setScrollLock } from '../lib/scroll';

// Hashed by Vite (src/assets/projects, built by scripts/projects-img.mjs), so hosts can cache them for good.
const PHOTOS = import.meta.glob<string>('../assets/projects/*.webp', { eager: true, query: '?url', import: 'default' });
const photo = (slug: string) => PHOTOS[`../assets/projects/${slug}.webp`];

type CaseCopy = { tagline: string; decisions: string[]; stats?: { value: string; label: string }[] };
type Stage = 'closed' | 'in' | 'shown' | 'open' | 'out' | 'gone';
const STEP_MS = 520;

// The case in the page's voice, as rows like the About: a mono label on the left, the content on one axis on the
// right, a hairline between rows. The key fact sits big beside the title.
const MONO_LINK = 'ink-auto inline-flex min-h-11 items-center gap-2 font-mono text-xs uppercase tracking-[0.06em] underline-offset-4 hover:underline';

function CaseDetail({ project, num, next, onNext }: { project: Project; num: string; next: Project | null; onNext: () => void }) {
  const t = useT();
  const copy = (useMessages().cases as Record<string, CaseCopy>)[project.slug];
  return (
    <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-32 sm:px-8 md:pt-40">
      <header className="relative grid items-end gap-x-16 gap-y-8 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
        <div className="relative">
          <span aria-hidden="true" className="ghost-numeral" data-n={num} />
          <h2 id="case-title" className="relative max-w-4xl text-3xl leading-[1.05] font-[var(--font-weight-display)] tracking-[var(--tracking-display)]">
            <BlurReveal as="span" inView>{t(`projects.${project.slug}.name`)}</BlurReveal>
          </h2>
          <BlurReveal as="p" inView delay={0.3} className="hero-tagline relative mt-5 max-w-[60ch] sm:mt-6">
            {copy.tagline}
          </BlurReveal>
        </div>
        {copy.stats ? (
          <div className="grid gap-8">
            {copy.stats.map((x) => (
              <p key={x.label}>
                <span className="block text-5xl leading-none font-[var(--font-weight-display)] tracking-[var(--tracking-display)]">{x.value}</span>
                <span className="mt-3 block font-mono text-xs uppercase tracking-[0.06em] text-muted">{x.label}</span>
              </p>
            ))}
          </div>
        ) : (
          <p className="text-2xl leading-tight font-[var(--font-weight-display)] tracking-[var(--tracking-display)]">{t(`projects.${project.slug}.fact`)}</p>
        )}
      </header>

      <div className="mt-20 border-b border-line">
        <Row title={t('generate.overview')}>
          <p className="max-w-[62ch] text-lg leading-relaxed">{t(`projects.${project.slug}.summary`)}</p>
          <div className="mt-3 flex flex-wrap gap-x-8">
            <a href={project.data.url} target="_blank" rel="noopener noreferrer" className={MONO_LINK}>
              {t('generate.repo')}
              <span className="sr-only"> {t('a11y.newTab')}</span>
              <ArrowUpRight className="size-3.5" aria-hidden="true" strokeWidth={1.75} />
            </a>
            {project.links.video && (
              <a href={project.links.video} target="_blank" rel="noopener noreferrer" className={`${MONO_LINK} text-muted hover:text-text`}>
                <Play className="size-3.5" aria-hidden="true" strokeWidth={1.75} />
                {t('generate.demo')}
                <span className="sr-only"> {t('a11y.newTab')}</span>
              </a>
            )}
            {project.links.notes && (
              <a href={project.links.notes} target="_blank" rel="noopener noreferrer" className={`${MONO_LINK} text-muted hover:text-text`}>
                {t('generate.notes')}
                <span className="sr-only"> {t('a11y.newTab')}</span>
                <ArrowUpRight className="size-3.5" aria-hidden="true" strokeWidth={1.75} />
              </a>
            )}
          </div>
        </Row>
        <Row title={t('generate.stack')}>
          <p className="font-mono text-xs uppercase leading-loose tracking-wider text-muted">{project.stack.join(' · ')}</p>
        </Row>
        <Row title={t('generate.diagram')}>
          <Diagram slug={project.slug} />
        </Row>
        <Row title={t('generate.decisions')}>
          <ol className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
            {copy.decisions.map((d, i) => (
              <li key={d} className="border-t border-line pt-4 text-lg leading-snug font-medium">
                <span className="mb-3 block font-mono text-xs text-muted" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                {d}
              </li>
            ))}
          </ol>
        </Row>
      </div>

      {next ? (
        <button type="button" onClick={onNext} className="group mt-12 flex w-full cursor-pointer items-baseline justify-between gap-8 text-left">
          <span>
            <span className="block font-mono text-xs uppercase tracking-[0.06em] text-muted">{t('generate.next')}</span>
            <span className="mt-2 block text-3xl leading-[1.05] font-[var(--font-weight-display)] tracking-[var(--tracking-display)]">{t(`projects.${next.slug}.name`)}</span>
          </span>
          <span className={MONO_LINK} aria-hidden="true">
            {t('generate.openCase')}
            <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={1.75} />
          </span>
        </button>
      ) : (
        // The last case has no next one: it ends on the full list instead of looping back to the first.
        <a href={profile.github} target="_blank" rel="noopener noreferrer" className="group mt-12 flex items-baseline justify-between gap-8">
          <span className="block text-3xl leading-[1.05] font-[var(--font-weight-display)] tracking-[var(--tracking-display)]">
            {t('generate.more')} {t('generate.moreHint')}
            <span className="sr-only"> {t('a11y.newTab')}</span>
          </span>
          <ArrowUpRight className="size-5 flex-none transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" strokeWidth={1.75} />
        </a>
      )}
    </div>
  );
}

export default function Generate() {
  const t = useT();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const [current, setCurrent] = useState<Project | null>(null);
  const [stage, setStage] = useState<Stage>('closed');

  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const items = useMemo(
    () =>
      featured.map((p, i) => ({
        id: p.slug,
        num: String(i + 1).padStart(2, '0'),
        name: t(`projects.${p.slug}.name`),
        sublabel: p.stack.slice(0, 3).join(' · '),
        image: photo(p.slug),
      })),
    [t],
  );

  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const open = (p: Project) => {
    openerRef.current = document.activeElement as HTMLElement | null;
    setCurrent(p);
    setScrollLock(true);
    overlayPush();
    dialogRef.current?.showModal();
    if (reduce()) return setStage('open');
    setStage('in');
    later(STEP_MS, () => setStage('shown'));
    later(STEP_MS * 2, () => setStage('open'));
  };

  // Next project: the curtain covers the case, the case swaps behind it, then reveals the new one.
  const go = (p: Project) => {
    if (reduce()) {
      setCurrent(p);
      pageRef.current?.scrollTo(0, 0);
      return;
    }
    setStage('out');
    later(STEP_MS, () => {
      setCurrent(p);
      pageRef.current?.scrollTo(0, 0);
      setStage('shown');
    });
    later(STEP_MS * 2, () => setStage('open'));
  };

  const close = (after?: () => void) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const finish = () => {
      dialogRef.current?.close();
      setScrollLock(false);
      setStage('closed');
      setCurrent(null);
      openerRef.current?.focus();
      after?.();
    };
    if (reduce()) return finish();
    setStage('out');
    later(STEP_MS, () => setStage('gone'));
    later(STEP_MS * 2, finish);
  };

  // Focus lands on Back once the case is fully shown (it is disabled while the curtain moves).
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
    <section id="generate" data-stage="generate" aria-labelledby="generate-title" className="scroll-mt-24 px-5 py-24 sm:px-8 md:py-36">
      <div className="relative mx-auto max-w-6xl">
        <header className="relative">
          <span aria-hidden="true" className="ghost-numeral" data-n="02" />
          <h2 id="generate-title" className="relative max-w-3xl text-3xl leading-[1.05] font-[var(--font-weight-display)] tracking-[var(--tracking-display)]">
            <BlurReveal as="span" inView>{t('generate.title')}</BlurReveal>
          </h2>
          <BlurReveal as="p" inView delay={0.3} className="hero-tagline relative mt-5 sm:mt-6">
            {t('generate.lead')}
          </BlurReveal>
        </header>
        {/* Hovering a project shows its photo through an animated mask; opening it plays the curtain into the case. */}
        <div className="relative mt-20 md:mt-28">
          <StackInteractor
            paused={stage !== 'closed'}
            openLabel={t('generate.openCase')}
            items={items}
            onSelect={(i) => open(featured[i])}
          />
        </div>
        {/* Mono like the page's other labels; the full name ("See all projects on GitHub") is for screen readers.
            Negative text, not amber: the dark set's amber flips in while the link is still over paper. */}
        <a href={profile.github} target="_blank" rel="noopener noreferrer" className="ink-auto relative mt-12 inline-flex min-h-11 items-center gap-2 font-mono text-xs uppercase tracking-[0.06em] underline-offset-4 hover:underline">
          {t('generate.more')}
          <span className="sr-only"> {t('generate.moreHint')} {t('a11y.newTab')}</span>
          <ArrowUpRight className="size-3.5" aria-hidden="true" strokeWidth={1.75} />
        </a>
      </div>

      <dialog ref={dialogRef} aria-labelledby="case-title" className="case-dialog" data-stage={stage} data-lenis-prevent>
        <div className="case-curtain case-curtain-ink" aria-hidden="true" />
        <div className="case-curtain case-curtain-amber" aria-hidden="true" />
        <div ref={pageRef} className="case-page">
          <button ref={backRef} type="button" onClick={() => overlayBack(close)} disabled={stage !== 'open'} className="case-back">
            <ArrowLeft className="size-4" aria-hidden="true" strokeWidth={1.75} />
            {t('generate.back')}
          </button>
          {/* The page's column guides, fixed behind the case as they are behind the page. */}
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
          {current && (() => {
            const i = featured.findIndex((p) => p.slug === current.slug);
            const next = featured[i + 1] ?? null;
            return <CaseDetail key={current.slug} project={current} num={String(i + 1).padStart(2, '0')} next={next} onNext={() => next && go(next)} />;
          })()}
        </div>
      </dialog>
    </section>
  );
}
