import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Asterisk, Play } from 'lucide-react';
import { Guides } from '../components/Background';
import Diagram from '../components/Diagram';
import BlurReveal from '../components/ui/BlurReveal';
import StackInteractor from '../components/ui/StackInteractor';
import profile from '../content/profile.json';
import { useMessages, useT } from '../i18n';
import { featured, type Project } from '../lib/projects';
import { setScrollLock } from '../lib/scroll';

// Hashed by Vite (src/assets/projects, built by scripts/projects-img.mjs), so hosts can cache them for good.
const PHOTOS = import.meta.glob<string>('../assets/projects/*.webp', { eager: true, query: '?url', import: 'default' });
const photo = (slug: string) => PHOTOS[`../assets/projects/${slug}.webp`];

type CaseCopy = { tagline: string; decisions: string[] };
// Curtain change between the page and a case: cover (in) → reveal the case (shown) → open;
// back: cover the case (out) → reveal the page (gone) → closed.
type Stage = 'closed' | 'in' | 'shown' | 'open' | 'out' | 'gone';
const STEP_MS = 520;

// The case in the page's voice: section-style title over its ghost number, mono labels and links, and the key
// decisions as numbered rows on hairlines like the Skills groups.
const LABEL = 'flex items-center gap-2.5 text-sm font-medium uppercase tracking-[0.08em] text-muted';
const MONO_LINK = 'inline-flex min-h-11 items-center gap-2 font-mono text-xs uppercase tracking-[0.06em] underline-offset-4 hover:underline';

function CaseDetail({ project, num }: { project: Project; num: string }) {
  const t = useT();
  const copy = (useMessages().cases as Record<string, CaseCopy>)[project.slug];
  return (
    <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-32 sm:px-8 md:pt-40">
      <header className="relative">
        <span aria-hidden="true" className="ghost-numeral" data-n={num} />
        <h2 id="case-title" className="relative max-w-4xl text-3xl leading-[1.05] font-[var(--font-weight-display)] tracking-[var(--tracking-display)]">
          <BlurReveal as="span" inView>{t(`projects.${project.slug}.name`)}</BlurReveal>
        </h2>
        <BlurReveal as="p" inView delay={0.3} className="hero-tagline relative mt-5 max-w-[60ch] sm:mt-6">
          {copy.tagline}
        </BlurReveal>
      </header>
      <div className="mt-8 flex flex-wrap gap-x-8">
        <a href={project.data.url} target="_blank" rel="noopener noreferrer" className={`${MONO_LINK} text-text`}>
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
      </div>
      <p className="mt-2 font-mono text-xs uppercase tracking-wider text-muted">
        <span className="sr-only">{t('generate.stack')}: </span>
        {project.stack.join(' · ')}
      </p>
      <p className="mt-12 max-w-[62ch] text-lg leading-relaxed">{t(`projects.${project.slug}.summary`)}</p>
      <div className="mt-16 rounded-panel bg-surface p-6 sm:p-8">
        <Diagram slug={project.slug} />
      </div>
      <h3 className={`mt-20 ${LABEL}`}>
        <Asterisk className="size-5 text-accent" aria-hidden="true" strokeWidth={2} />
        {t('generate.decisions')}
      </h3>
      <ol className="mt-8 grid gap-x-12 sm:grid-cols-3">
        {copy.decisions.map((d, i) => (
          <li key={d} className="flex gap-4 border-t border-line py-6 font-medium leading-snug">
            <span className="font-mono text-xs text-muted" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
            {d}
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function Generate() {
  const t = useT();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const backRef = useRef<HTMLButtonElement>(null);
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
    dialogRef.current?.showModal();
    if (reduce()) return setStage('open');
    setStage('in');
    later(STEP_MS, () => setStage('shown'));
    later(STEP_MS * 2, () => setStage('open'));
  };

  const close = () => {
    const finish = () => {
      dialogRef.current?.close();
      setScrollLock(false);
      setStage('closed');
      setCurrent(null);
      openerRef.current?.focus();
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
      if (stage === 'open') close();
    };
    d.addEventListener('cancel', onCancel);
    return () => d.removeEventListener('cancel', onCancel);
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
        <div className="case-page">
          <button ref={backRef} type="button" onClick={close} disabled={stage !== 'open'} className="case-back">
            <ArrowLeft className="size-4" aria-hidden="true" strokeWidth={1.75} />
            {t('generate.back')}
          </button>
          {/* The page's column guides, fixed behind the case as they are behind the page. */}
          <div aria-hidden="true" className="case-guides">
            <Guides />
          </div>
          {current && <CaseDetail project={current} num={String(featured.findIndex((p) => p.slug === current.slug) + 1).padStart(2, '0')} />}
        </div>
      </dialog>
    </section>
  );
}
