import { useEffect, useRef } from 'react';
import { ArrowUpRight, Play } from 'lucide-react';
import Diagram from '../components/Diagram';
import Thinking, { useGenerate } from '../components/Thinking';
import { useMessages, useT } from '../i18n';
import { featured, type Project } from '../lib/projects';
import { isPinned } from '../lib/scroll';

type CaseCopy = { tagline: string; decisions: string[] };

// Writes scroll progress through `ref` (0..1) to the CSS variable --sp. No React re-renders.
function useSceneProgress(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!isPinned()) return el.style.removeProperty('--sp');
      const r = el.getBoundingClientRect();
      const total = r.height - innerHeight;
      el.style.setProperty('--sp', String(total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1));
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
  }, [ref]);
}

function CaseStudy({ project, scene }: { project: Project; scene: boolean }) {
  const t = useT();
  const copy = (useMessages().cases as Record<string, CaseCopy>)[project.slug];
  const sceneRef = useRef<HTMLDivElement>(null);
  useSceneProgress(sceneRef);
  const titleId = `${project.slug}-title`;

  const panel = (
    <div className="scene-panel rounded-panel bg-surface p-6 sm:p-10">
      <h3 id={titleId} className="font-display text-3xl leading-none">
        {t(`projects.${project.slug}.name`)}
      </h3>
      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:items-start lg:gap-12">
        <div>
          <p className="text-lg leading-relaxed">{copy.tagline}</p>
          <h4 className="mt-8 text-sm text-muted">{t('generate.decisions')}</h4>
          <ul className="mt-3 space-y-2.5">
            {copy.decisions.map((d) => (
              <li key={d} className="flex gap-3 font-medium leading-snug">
                <span className="mt-[0.55em] size-1.5 shrink-0 rounded-full bg-accent-fill" aria-hidden="true" />
                {d}
              </li>
            ))}
          </ul>
          <ul className="mt-8 flex flex-wrap gap-1.5" aria-label={t('generate.stack')}>
            {project.stack.map((s) => (
              <li key={s} className="rounded-chip bg-surface-2 px-2.5 py-1.5 text-[0.8125rem] text-muted">{s}</li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
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
        </div>
        <div className="min-w-0">
          <p className="mb-3 text-sm text-muted">{t('generate.diagram')}</p>
          <Diagram slug={project.slug} scrollDriven={scene} />
        </div>
      </div>
    </div>
  );

  return (
    <article id={project.slug} aria-labelledby={titleId} className="scroll-mt-24">
      {scene ? (
        <div ref={sceneRef} className="scene relative">
          {/* In pinned mode, links to this case land where the panel is open and the diagram drawn. */}
          <span aria-hidden="true" data-anchor={project.slug} className="story-marker" style={{ ['--at' as string]: 0.85 }} />
          <div className="scene-stage">{panel}</div>
        </div>
      ) : (
        panel
      )}
    </article>
  );
}

const THINK_MS = 1200;

export default function Generate() {
  const t = useT();
  const gen = useGenerate<HTMLDivElement>(THINK_MS);
  return (
    <section id="generate" data-stage="generate" aria-labelledby="generate-title" className="scroll-mt-24 px-5 py-24 sm:px-8 md:py-36">
      <div ref={gen.ref} data-gen={gen.state} className="relative mx-auto max-w-6xl">
        <Thinking block="generate" ms={THINK_MS} />
        <header className="relative mb-16 md:mb-24" data-stream>
          <span aria-hidden="true" className="ghost-numeral" data-n="04" />
          <h2 id="generate-title" className="relative max-w-3xl font-display text-3xl leading-[1.05]">
            {t('generate.title')}
          </h2>
          <p className="relative mt-5 max-w-[60ch] text-lg text-muted">{t('generate.lead')}</p>
        </header>
        <div className="grid gap-16 md:gap-24">
          {featured.map((p, i) => (
            <CaseStudy key={p.slug} project={p} scene={i === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}
