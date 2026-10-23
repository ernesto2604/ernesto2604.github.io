import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { useT } from '../i18n';
import { shortDate, topLanguage, type Project } from '../lib/projects';

export default function ProjectCard({ project, position }: { project: Project; position: number }) {
  const t = useT();
  const name = t(`projects.${project.slug}.name`);
  const lang = topLanguage(project);
  const titleId = `card-${project.slug}-title`;

  return (
    <article
      id={`card-${project.slug}`}
      aria-labelledby={titleId}
      className="group relative grid scroll-mt-28 gap-8 rounded-card border border-line bg-surface p-6 transition-colors duration-300 hover:border-line-strong sm:p-8 md:grid-cols-[minmax(0,1fr)_15rem] md:gap-12 md:p-10"
    >
      <div>
        <p className="eyebrow">
          <span className="text-accent">{String(position).padStart(2, '0')}</span> · {t('rerank.featured')}
        </p>
        <h3 id={titleId} className="mt-4 font-display text-3xl font-light leading-none tracking-tight">
          {name}
        </h3>
        <p className="mt-5 max-w-[62ch] text-muted">{t(`projects.${project.slug}.summary`)}</p>
        <ul className="mt-6 flex flex-wrap gap-1.5" aria-label={t('rerank.stack')}>
          {project.stack.map((s) => (
            <li key={s} className="rounded-chip border border-line px-2 py-1 font-mono text-[0.6875rem] text-muted">
              {s}
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <a href={`#${project.slug}`} className="inline-flex items-center gap-2 font-medium text-accent underline-offset-4 hover:underline">
            {t('rerank.readCase')}
            <ArrowDown className="size-4" aria-hidden="true" strokeWidth={1.75} />
          </a>
          <a
            href={project.data.url}
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-text"
            aria-label={t('retrieval.openRepo', { name })}
          >
            GitHub
            <ArrowUpRight className="size-4" aria-hidden="true" strokeWidth={1.75} />
          </a>
        </div>
      </div>

      <dl className="grid content-start gap-5 border-t border-line pt-6 font-mono text-xs md:border-l md:border-t-0 md:pl-8 md:pt-1">
        <div>
          <dt className="eyebrow">{t('rerank.keyFact')}</dt>
          <dd className="mt-1.5 text-sm leading-snug text-text">{t(`projects.${project.slug}.fact`)}</dd>
        </div>
        {lang && (
          <div>
            <dt className="eyebrow">{t('retrieval.language')}</dt>
            <dd className="mt-1.5 text-text">
              {lang.name} <span className="text-muted">{lang.pct}%</span>
            </dd>
          </div>
        )}
        <div>
          <dt className="eyebrow">{t('retrieval.updated')}</dt>
          <dd className="mt-1.5 text-text">
            <time dateTime={project.data.updatedAt}>{shortDate(project.data.updatedAt)}</time>
          </dd>
        </div>
        {project.data.stars > 0 && (
          <div>
            <dt className="eyebrow">{t('retrieval.stars')}</dt>
            <dd className="mt-1.5 text-text">{project.data.stars}</dd>
          </div>
        )}
      </dl>
    </article>
  );
}
