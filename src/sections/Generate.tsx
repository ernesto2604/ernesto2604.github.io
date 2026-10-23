import { useEffect, useRef } from 'react';
import { ArrowUpRight, Play } from 'lucide-react';
import Diagram from '../components/Diagram';
import { useMessages, useT } from '../i18n';
import { featured, type Project } from '../lib/projects';
import { isPinned } from '../lib/scroll';

type CaseCopy = { decisions: { title: string; body: string }[]; limitations: string[]; next: string[] };

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
  const k = (key: string) => t(`cases.${project.slug}.${key}`);
  const titleId = `${project.slug}-title`;

  const panel = (
    <div className="scene-panel rounded-panel bg-surface p-6 sm:p-10">
      <h3 id={titleId} className="font-display text-3xl font-light leading-none tracking-tight">
        {t(`projects.${project.slug}.name`)}
      </h3>
      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:items-start lg:gap-12">
        <div>
          <p className="leading-relaxed">{k('problem')}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">{k('context')}</p>
          <ul className="mt-6 flex flex-wrap gap-1.5" aria-label={t('generate.stack')}>
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
          <div className="scene-stage">{panel}</div>
        </div>
      ) : (
        panel
      )}

      <div className="mt-14 grid grid-cols-[minmax(0,1fr)] gap-x-14 gap-y-6 px-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-y-12">
        <h4 className="text-xl font-medium tracking-tight">{t('generate.approach')}</h4>
        <p className="max-w-[68ch] leading-relaxed">{k('approach')}</p>

        <h4 className="text-xl font-medium tracking-tight">{t('generate.decisions')}</h4>
        <dl className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
          {copy.decisions.map((d) => (
            <div key={d.title}>
              <dt className="font-medium">{d.title}</dt>
              <dd className="mt-1.5 text-muted">{d.body}</dd>
            </div>
          ))}
        </dl>

        <h4 className="text-xl font-medium tracking-tight">{t('generate.limitations')}</h4>
        <ul className="max-w-[68ch] list-disc space-y-2 pl-5 text-muted marker:text-accent">
          {copy.limitations.map((x) => <li key={x}>{x}</li>)}
        </ul>

        <h4 className="text-xl font-medium tracking-tight">{t('generate.next')}</h4>
        <div>
          <ul className="max-w-[68ch] list-disc space-y-2 pl-5 text-muted">
            {copy.next.map((x) => <li key={x}>{x}</li>)}
          </ul>
          <p className="mt-3 text-sm text-muted">{t('generate.nextNote')}</p>
        </div>
      </div>
    </article>
  );
}

export default function Generate() {
  const t = useT();
  return (
    <section id="generate" data-stage="generate" aria-labelledby="generate-title" className="scroll-mt-24 px-5 py-24 sm:px-8 md:py-36">
      <div className="mx-auto max-w-6xl">
        <header className="relative mb-16 md:mb-24">
          <span aria-hidden="true" className="ghost-numeral">04</span>
          <h2 id="generate-title" className="relative max-w-3xl font-display text-3xl font-light leading-[1.05] tracking-tight">
            {t('generate.title')}
          </h2>
          <p className="relative mt-5 max-w-[60ch] text-lg text-muted">{t('generate.lead')}</p>
        </header>
        <div className="grid gap-32 md:gap-44">
          {featured.map((p, i) => (
            <CaseStudy key={p.slug} project={p} scene={i === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}
