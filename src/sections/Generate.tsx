import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Play } from 'lucide-react';
import Diagram from '../components/Diagram';
import Thinking, { SETTLED, useGenerate } from '../components/Thinking';
import FolderFloat from '../components/ui/FolderFloat';
import { useMessages, useT } from '../i18n';
import { featured, type Project } from '../lib/projects';
import { setScrollLock } from '../lib/scroll';

type CaseCopy = { tagline: string; decisions: string[] };
// Curtain change between the page and a case: cover (in) → reveal the case (shown) → open;
// back: cover the case (out) → reveal the page (gone) → closed.
type Stage = 'closed' | 'in' | 'shown' | 'open' | 'out' | 'gone';
const STEP_MS = 520;

const THINK_MS = 1200;

function CaseDetail({ project }: { project: Project }) {
  const t = useT();
  const copy = (useMessages().cases as Record<string, CaseCopy>)[project.slug];
  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-28 sm:px-8">
      <h2 id="case-title" className="font-display text-4xl leading-[1.02]">{t(`projects.${project.slug}.name`)}</h2>
      <p className="mt-5 max-w-[60ch] text-lg leading-relaxed">{copy.tagline}</p>
      <div className="mt-6 flex flex-wrap gap-x-6">
        <a href={project.data.url} className="inline-flex min-h-11 items-center gap-1.5 font-medium text-accent underline-offset-4 hover:underline">
          {t('generate.repo')}
          <ArrowUpRight className="size-4" aria-hidden="true" strokeWidth={1.75} />
        </a>
        {project.links.video && (
          <a href={project.links.video} className="inline-flex min-h-11 items-center gap-1.5 font-medium text-muted hover:text-text">
            <Play className="size-4" aria-hidden="true" strokeWidth={1.75} />
            {t('generate.demo')}
          </a>
        )}
      </div>
      <p className="mt-2 text-sm text-muted">
        <span className="sr-only">{t('generate.stack')}: </span>
        {project.stack.join(' · ')}
      </p>
      <p className="mt-10 max-w-[68ch] leading-relaxed text-muted">{t(`projects.${project.slug}.summary`)}</p>
      <div className="mt-12 rounded-panel bg-surface p-6 sm:p-8">
        <Diagram slug={project.slug} />
      </div>
      <h3 className="mt-12 text-sm text-muted">{t('generate.decisions')}</h3>
      <ul className="mt-4 grid gap-4 sm:grid-cols-3">
        {copy.decisions.map((d) => (
          <li key={d} className="flex gap-3 rounded-card bg-surface px-5 py-4 font-medium leading-snug">
            <span className="mt-[0.5em] size-1.5 shrink-0 rounded-full bg-accent-fill" aria-hidden="true" />
            {d}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Generate() {
  const t = useT();
  const cases = useMessages().cases as Record<string, CaseCopy>;
  // It thinks once the section has swapped in at the top (see swapAtSeam), centred like the hero.
  const gen = useGenerate<HTMLDivElement>(THINK_MS, true, SETTLED);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const timers = useRef<number[]>([]);
  const [current, setCurrent] = useState<Project | null>(null);
  const [stage, setStage] = useState<Stage>('closed');

  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

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
    <section id="generate" data-stage="generate" data-seam aria-labelledby="generate-title" className="scroll-mt-24 px-5 py-24 sm:px-8 md:py-36">
      <div ref={gen.ref} data-gen={gen.state} className="relative mx-auto max-w-6xl">
        <Thinking block="generate" ms={THINK_MS} center />
        <header className="relative" data-stream>
          <span aria-hidden="true" className="ghost-numeral" data-n="03" />
          <h2 id="generate-title" className="relative max-w-3xl font-display text-3xl leading-[1.05]">
            {t('generate.title')}
          </h2>
          <p className="relative mt-5 max-w-[52ch] text-lg text-muted">{t('generate.lead')}</p>
        </header>
        {/* Hovering a folder floats its key decisions out as notes; opening it plays the curtain into the case. */}
        <ul className="gen-folders" data-stream>
          {featured.map((p) => (
            <li key={p.slug} id={p.slug} className="flex justify-center scroll-mt-48">
              <FolderFloat
                label={t(`projects.${p.slug}.name`)}
                sublabel={p.stack.slice(0, 3).join(' · ')}
                items={cases[p.slug].decisions}
                ariaLabel={t('generate.openCase', { name: t(`projects.${p.slug}.name`) })}
                onActivate={() => open(p)}
                folderColor="#2A2E36"
                frontColor="#3A3F49"
                paperColor="#F5F6F8"
                itemColor="#FFFFFF"
                itemTextColor="#0D1015"
                labelColor="#F5F6F8"
                width={260}
                height={190}
                spread={210}
                lift={34}
              />
            </li>
          ))}
        </ul>
      </div>

      <dialog ref={dialogRef} aria-labelledby="case-title" className="case-dialog" data-stage={stage} data-lenis-prevent>
        <div className="case-curtain case-curtain-ink" aria-hidden="true" />
        <div className="case-curtain case-curtain-amber" aria-hidden="true" />
        <div className="case-page">
          <button ref={backRef} type="button" onClick={close} disabled={stage !== 'open'} className="case-back">
            <ArrowLeft className="size-4" aria-hidden="true" strokeWidth={1.75} />
            {t('generate.back')}
          </button>
          {current && <CaseDetail project={current} />}
        </div>
      </dialog>
    </section>
  );
}
