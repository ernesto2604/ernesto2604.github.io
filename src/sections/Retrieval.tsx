import { useMemo, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import Stage from '../components/Stage';
import ScoreBar from '../components/ScoreBar';
import { useInView } from '../hooks/useInView';
import { fetchedAt } from '../data/repos';
import { useMessages, useT } from '../i18n';
import { projects, repoIndex, shortDate } from '../lib/projects';
import { search } from '../lib/search';

export default function Retrieval() {
  const t = useT();
  const terms = useMessages().retrieval.terms;
  const [term, setTerm] = useState<string | null>(null);
  const [listRef, inView] = useInView<HTMLOListElement>();

  const rows = useMemo(() => {
    const hits = search(repoIndex, term ?? terms.join(' '));
    const bySlug = new Map(hits.map((h) => [h.id, h]));
    return projects
      .map((p) => ({ p, hit: bySlug.get(p.slug) }))
      .sort((a, b) => (b.hit?.score ?? 0) - (a.hit?.score ?? 0));
  }, [term, terms]);

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs transition-colors duration-200 ${
      active ? 'border-accent/50 bg-accent-soft text-accent' : 'border-line text-muted hover:border-line-strong hover:text-text'
    }`;

  return (
    <Stage id="retrieval" index={2} eyebrow={t('retrieval.eyebrow')} title={t('retrieval.title')} className="py-24 md:py-32">
      <div className="rounded-card border border-line bg-surface p-5 sm:p-7">
        <div className="flex flex-col gap-3">
          <p className="eyebrow">{t('retrieval.expansionLabel')}</p>
          <div role="group" aria-label={t('retrieval.filterLabel')} className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={term === null} onClick={() => setTerm(null)} className={chip(term === null)}>
              {t('retrieval.allTerms')}
            </button>
            {terms.map((x) => (
              <button key={x} type="button" aria-pressed={term === x} onClick={() => setTerm(x)} className={chip(term === x)}>
                {x}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted">{t('retrieval.expansionNote')}</p>
        </div>

        <ol ref={listRef} className="mt-7 divide-y divide-line border-t border-line">
          {rows.map(({ p, hit }, i) => {
            const name = t(`projects.${p.slug}.name`);
            const score = hit?.score ?? 0;
            return (
              <li key={p.slug} className={`grid grid-cols-[2rem_1fr_auto] items-center gap-x-4 gap-y-2 py-4 sm:grid-cols-[2.5rem_minmax(0,14rem)_1fr_4rem_auto] ${score ? '' : 'opacity-55'}`}>
                <span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, '0')}</span>
                <a href={`#card-${p.slug}`} className="truncate font-medium hover:text-accent" aria-label={t('retrieval.viewCard', { name })}>
                  {name}
                </a>
                <span className="col-span-2 col-start-2 row-start-2 flex items-center gap-3 sm:col-span-1 sm:col-start-auto sm:row-start-auto">
                  <ScoreBar value={score} show={inView} />
                </span>
                <span className="col-start-3 row-start-1 text-right font-mono text-xs tabular-nums sm:col-start-auto sm:row-start-auto">
                  <span className="sr-only">{t('retrieval.score')} </span>
                  {score ? score.toFixed(3) : '0.000'}
                </span>
                <span className="col-span-2 col-start-2 font-mono text-[0.6875rem] text-muted sm:col-span-1 sm:col-start-auto sm:flex sm:items-center sm:gap-3">
                  {hit ? `${t('retrieval.matched')}: ${hit.matched.join(', ')}` : t('retrieval.noMatch')}
                  <a href={p.data.url} className="ml-2 hidden text-muted hover:text-accent sm:inline" aria-label={t('retrieval.openRepo', { name })}>
                    <ArrowUpRight className="inline size-4" aria-hidden="true" strokeWidth={1.75} />
                  </a>
                </span>
              </li>
            );
          })}
        </ol>

        <p className="mt-6 max-w-[80ch] text-xs leading-relaxed text-muted">
          {t('retrieval.scoreNote')}{' '}
          {fetchedAt && t('retrieval.dataNote', { date: shortDate(fetchedAt) })}
        </p>
      </div>
    </Stage>
  );
}
