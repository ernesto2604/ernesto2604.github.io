import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowUpRight, Play } from 'lucide-react';
import Diagram from '../components/Diagram';
import Thinking, { useGenerate } from '../components/Thinking';
import { useMessages, useT } from '../i18n';
import { featured, type Project } from '../lib/projects';
import { PINNED_QUERY, isPinned, resolveAnchor, scrollToElement } from '../lib/scroll';

type CaseCopy = { tagline: string; decisions: string[] };
type Pos = 'past' | 'current' | 'next';

// Pinned mode: the header stays on the left while the cards deal in on the right, one per third of the
// scene's scroll. The card switch is discrete (a CSS transition), the diagram draws with the scroll itself.
// Each case's anchor lands at 80% of its third, where its diagram is fully drawn.
const anchorAt = (k: number) => (k + 0.8) / featured.length;

function CaseCard({ project, k, pos, depth, scrollDriven }: { project: Project; k: number; pos: Pos; depth: number; scrollDriven: boolean }) {
  const t = useT();
  const copy = (useMessages().cases as Record<string, CaseCopy>)[project.slug];
  const titleId = `${project.slug}-title`;
  // Keyboard users tabbing into a card that is not on top are scrolled to it instead of focusing something hidden.
  const onFocus = () => {
    if (!isPinned() || pos === 'current') return;
    const marker = resolveAnchor(project.slug);
    if (marker) scrollToElement(marker, true);
  };

  return (
    <article
      id={project.slug}
      aria-labelledby={titleId}
      data-pos={pos}
      onFocusCapture={onFocus}
      className="gen-card scroll-mt-24 rounded-panel bg-surface p-6 sm:p-8"
      style={{ '--k': k, '--d': depth } as CSSProperties}
    >
      <div className="flex items-start justify-between gap-x-6">
        <h3 id={titleId} className="min-w-0 pt-2 font-display text-xl leading-tight">
          {t(`projects.${project.slug}.name`)}
        </h3>
        <div className="flex shrink-0 flex-wrap justify-end gap-x-5">
          <a href={project.data.url} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-accent underline-offset-4 hover:underline">
            {t('generate.repo')}
            <ArrowUpRight className="size-4" aria-hidden="true" strokeWidth={1.75} />
          </a>
          {project.links.video && (
            <a href={project.links.video} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted hover:text-text">
              <Play className="size-4" aria-hidden="true" strokeWidth={1.75} />
              {t('generate.demo')}
            </a>
          )}
        </div>
      </div>
      <p className="mt-1 max-w-[60ch] leading-relaxed">{copy.tagline}</p>
      <p className="mt-2 text-sm text-muted">
        <span className="sr-only">{t('generate.stack')}: </span>
        {project.stack.join(' · ')}
      </p>
      <div className="mt-5">
        <Diagram slug={project.slug} scrollDriven={scrollDriven} />
      </div>
      <h4 className="mt-5 text-sm text-muted">{t('generate.decisions')}</h4>
      <ul className="mt-2.5 grid gap-x-5 gap-y-2 sm:grid-cols-3">
        {copy.decisions.map((d) => (
          <li key={d} className="flex gap-2.5 text-[0.9375rem] font-medium leading-snug">
            <span className="mt-[0.5em] size-1.5 shrink-0 rounded-full bg-accent-fill" aria-hidden="true" />
            {d}
          </li>
        ))}
      </ul>
    </article>
  );
}

const THINK_MS = 1200;

export default function Generate() {
  const t = useT();
  const gen = useGenerate<HTMLDivElement>(THINK_MS);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);
  const [active, setActive] = useState(0);

  // Scroll progress through the scene goes to --sp (diagram drawing, no re-render); only the card index is state.
  useEffect(() => {
    const scene = sceneRef.current!;
    const mq = matchMedia(PINNED_QUERY);
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!isPinned()) return scene.style.removeProperty('--sp');
      const r = scene.getBoundingClientRect();
      const total = r.height - innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1;
      scene.style.setProperty('--sp', String(p));
      setActive(Math.min(featured.length - 1, Math.floor(p * featured.length)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onMode = () => {
      setPinned(mq.matches);
      update();
    };
    setPinned(isPinned());
    mq.addEventListener('change', onMode);
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    update();
    return () => {
      mq.removeEventListener('change', onMode);
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const n = (i: number) => String(i + 1).padStart(2, '0');

  return (
    <section id="generate" data-stage="generate" aria-labelledby="generate-title" className="scroll-mt-24 px-5 py-24 sm:px-8 md:py-36">
      <div ref={gen.ref} data-gen={gen.state} className="relative mx-auto max-w-6xl">
        <Thinking block="generate" ms={THINK_MS} />
        <div ref={sceneRef} className="gen-scene relative" data-stream>
          {featured.map((p, k) => (
            <span key={p.slug} aria-hidden="true" data-anchor={p.slug} className="story-marker" style={{ ['--at' as string]: anchorAt(k) }} />
          ))}
          <div className="gen-stage" data-stream>
            <header className="relative" data-stream>
              <span aria-hidden="true" className="ghost-numeral" data-n="03" />
              <h2 id="generate-title" className="relative max-w-3xl font-display text-3xl leading-[1.05]">
                {t('generate.title')}
              </h2>
              <p className="relative mt-5 max-w-[44ch] text-lg text-muted">{t('generate.lead')}</p>
              <p className="gen-counter relative mt-8 font-mono text-sm tabular-nums text-muted" aria-hidden="true">
                {n(active)} / {n(featured.length - 1)}
              </p>
            </header>
            <div className="gen-deck">
              {featured.map((p, k) => (
                <CaseCard
                  key={p.slug}
                  project={p}
                  k={k}
                  pos={k < active ? 'past' : k === active ? 'current' : 'next'}
                  depth={Math.max(0, active - k)}
                  scrollDriven={pinned}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
