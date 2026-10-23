import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowDownRight, ArrowUpRight, MapPin, Minus } from 'lucide-react';
import TypedText from '../components/TypedText';
import ScoreBar from '../components/ScoreBar';
import { useShortcutLabel, openAgent, AGENT_READY } from '../components/Nav';
import { fetchedAt } from '../data/repos';
import { useFlip } from '../hooks/useFlip';
import { useMessages, useT } from '../i18n';
import { projects, repoIndex, shortDate, type Project } from '../lib/projects';
import { rankDeltas, rerank } from '../lib/rerank';
import { PINNED_QUERY, isPinned, resolveAnchor, scrollToElement } from '../lib/scroll';
import { search, tokenize } from '../lib/search';

type Phase = 'input' | 'terms' | 'retrieval' | 'rerank';

// Scroll progress (0..1) through the pinned story where each phase starts. Anchors sit inside each phase.
const PHASE_AT: [Phase, number][] = [['input', 0], ['terms', 0.1], ['retrieval', 0.3], ['rerank', 0.62]];
const ANCHOR_AT = { input: 0, retrieval: 0.4, rerank: 0.76 } as const;

const phaseFor = (p: number): Phase => PHASE_AT.filter(([, at]) => p >= at).at(-1)![0];

function Ghost({ n }: { n: number }) {
  return <span aria-hidden="true" className="ghost-numeral">{String(n).padStart(2, '0')}</span>;
}

function Caption({ stage, active, className = '', children }: { stage: 'input' | 'retrieval' | 'rerank'; active: boolean; className?: string; children: ReactNode }) {
  // Keyboard users tabbing into a hidden caption are scrolled to its phase instead of focusing something invisible.
  const onFocus = () => {
    if (!isPinned() || active) return;
    const marker = resolveAnchor(stage);
    if (marker) scrollToElement(marker, true);
  };
  return (
    <div id={stage} data-stage={stage} data-mode="stacked" onFocusCapture={onFocus} className={`story-cap story-cap-${stage} relative ${active ? 'is-active' : ''} ${className}`}>
      {children}
    </div>
  );
}

function Delta({ n }: { n: number }) {
  const t = useT();
  const label = n > 0 ? t('story.movedUp', { n }) : n < 0 ? t('story.movedDown', { n: -n }) : t('story.same');
  const Icon = n > 0 ? ArrowUpRight : n < 0 ? ArrowDownRight : Minus;
  return (
    <span className={`inline-flex items-center gap-0.5 font-mono text-[0.8125rem] tabular-nums ${n > 0 ? 'text-accent' : 'text-muted'}`}>
      <Icon className="size-3.5" aria-hidden="true" strokeWidth={2} />
      {n !== 0 && <span aria-hidden="true">{Math.abs(n)}</span>}
      <span className="sr-only">{label}</span>
    </span>
  );
}

export default function Story() {
  const t = useT();
  const shortcut = useShortcutLabel();
  const terms = useMessages().retrieval.terms;
  const [term, setTerm] = useState<string | null>(null);
  // Server HTML holds the finished state, so no-JS readers and crawlers get scores and the final order.
  const [phase, setPhase] = useState<Phase>('rerank');
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const rerankRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current!;
    const mq = matchMedia(PINNED_QUERY);
    let frame = 0;
    const update = () => {
      frame = 0;
      if (isPinned()) {
        const r = root.getBoundingClientRect();
        const total = r.height - innerHeight;
        setPhase(phaseFor(total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1));
      } else {
        const line = innerHeight * 0.8;
        const listTop = listRef.current!.getBoundingClientRect().top;
        const rerankTop = rerankRef.current!.getBoundingClientRect().top;
        setPhase(rerankTop < line ? 'rerank' : listTop < line ? 'retrieval' : 'terms');
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onMode = () => {
      document.documentElement.toggleAttribute('data-pinned', mq.matches);
      update();
    };
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

  const name = (p: Project) => t(`projects.${p.slug}.name`);
  const { hits, corpus, retrieval, final, deltas } = useMemo(() => {
    const hits = new Map(search(repoIndex, term ?? terms.join(' ')).map((h) => [h.id, h]));
    const corpus = [...projects].sort((a, b) => t(`projects.${a.slug}.name`).localeCompare(t(`projects.${b.slug}.name`)));
    const retrieval = [...corpus].sort((a, b) => (hits.get(b.slug)?.score ?? 0) - (hits.get(a.slug)?.score ?? 0));
    const final = rerank(projects);
    const deltas = rankDeltas(retrieval.map((p) => p.slug), final.map((p) => p.slug));
    return { hits, corpus, retrieval, final, deltas };
  }, [term, terms, t]);

  const order = phase === 'rerank' ? final : phase === 'retrieval' ? retrieval : corpus;
  const scored = phase === 'retrieval' || phase === 'rerank';
  useFlip(listRef, order.map((p) => p.slug).join());

  // Show the chip labels a hit matched (keeps accents), not the normalized tokens.
  const matchedLabels = (slug: string) => {
    const hit = hits.get(slug);
    if (!hit) return [];
    return (term ? [term] : terms).filter((x) => tokenize(x).some((tok) => hit.matched.includes(tok)));
  };

  const chip = (active: boolean) =>
    `min-h-11 rounded-full px-4 text-sm transition-colors duration-200 ${
      active ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-muted hover:text-text'
    }`;

  const listLabel = phase === 'rerank' ? '' : scored ? t('story.results') : t('story.corpus');
  const firstOther = final.find((p) => p.rank === null)?.slug;

  return (
    <div ref={rootRef} className="story relative" data-phase={phase}>
      {(['input', 'retrieval', 'rerank'] as const).map((s) => (
        <span key={s} aria-hidden="true" data-anchor={s} data-stage={s} data-mode="pinned" className="story-marker" style={{ ['--at' as string]: ANCHOR_AT[s] }} />
      ))}

      <div className="story-stage mx-auto max-w-6xl px-5 sm:px-8">
        {/* 01 · Input */}
        <Caption stage="input" active={phase === 'input'} className="story-hero flex min-h-[100svh] flex-col justify-center pb-16 pt-32">
          <p className="flex items-center gap-2.5 text-sm text-muted">
            <span aria-hidden="true" className="signal-dot" />
            {t('hero.queryLabel')}
          </p>
          <p className="story-query mt-4 max-w-3xl font-display text-2xl font-light leading-snug text-muted sm:text-3xl">
            <TypedText text={t('hero.query')} />
          </p>
          <h1 className="rise mt-10 font-display text-5xl font-light leading-[0.92] tracking-[-0.02em] story-h1">{t('hero.name')}</h1>
          <p className="fade-up mt-5 text-lg font-medium tracking-tight sm:text-xl" style={{ animationDelay: '120ms' }}>
            {t('hero.role')}
          </p>
          <p className="fade-up mt-4 max-w-[52ch] text-lg leading-relaxed text-muted" style={{ animationDelay: '220ms' }}>
            {t('hero.valueProp')}
          </p>
          <ul className="fade-up mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted" style={{ animationDelay: '300ms' }}>
            <li className="flex items-center gap-2">
              <MapPin className="size-4" aria-hidden="true" strokeWidth={1.75} />
              {t('hero.location')}
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="size-2 rounded-full bg-ok" />
              {t('hero.availability')}
            </li>
          </ul>
          <div className="fade-up mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: '380ms' }}>
            <a href="#rerank" className="magnetic inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 font-medium text-accent-ink transition-transform duration-200 hover:-translate-y-0.5">
              {t('hero.ctaWork')}
              <ArrowDown className="size-4" aria-hidden="true" strokeWidth={2} />
            </a>
            {AGENT_READY && (
              <button type="button" onClick={openAgent} className="no-js-hide inline-flex h-12 items-center gap-3 rounded-full bg-surface-2 pl-5 pr-2 font-medium transition-colors duration-200 hover:bg-line">
                {t('hero.ctaAgent')}
                <kbd className="kbd-hint rounded-full bg-bg-0 px-2.5 py-1 font-mono text-[0.8125rem] text-muted">{shortcut}</kbd>
              </button>
            )}
          </div>
        </Caption>

        {/* 02 · Retrieval */}
        <Caption stage="retrieval" active={phase === 'terms' || phase === 'retrieval'} className="pt-24 lg:pt-0">
          <Ghost n={2} />
          <h2 className="relative font-display text-3xl font-light leading-[1.05] tracking-tight">{t('retrieval.title')}</h2>
          <p className="relative mt-4 max-w-[46ch] text-muted">{t('retrieval.lead')}</p>
          <p className="relative mt-7 text-sm text-muted">{t('retrieval.expansionLabel')}</p>
          <div role="group" aria-label={t('retrieval.filterLabel')} className="story-chips relative mt-3 flex flex-wrap gap-2">
            <button type="button" aria-pressed={term === null} onClick={() => setTerm(null)} className={chip(term === null)}>
              {t('retrieval.allTerms')}
            </button>
            {terms.map((x) => (
              <button key={x} type="button" aria-pressed={term === x} onClick={() => setTerm(x)} className={chip(term === x)}>
                {x}
              </button>
            ))}
          </div>
          <p className="relative mt-5 max-w-[56ch] text-sm leading-relaxed text-muted">
            {t('retrieval.scoreNote')} {fetchedAt && t('retrieval.dataNote', { date: shortDate(fetchedAt) })}
          </p>
          <p className="sr-only" aria-live="polite">
            {term ? `${term}: ${retrieval.filter((p) => hits.has(p.slug)).map(name).join(', ')}` : ''}
          </p>
        </Caption>

        {/* Result set: one list for every phase; order changes, DOM order is the final ranking. */}
        <div className="story-list-wrap pt-10">
          <p className="mb-4 min-h-5 text-sm text-muted" aria-hidden="true">{listLabel}</p>
          <ol ref={listRef} className="flex flex-col gap-2">
            {final.map((p) => {
              const hit = hits.get(p.slug);
              const score = hit?.score ?? 0;
              const featured = p.rank !== null;
              const pos = order.indexOf(p);
              const groupLabel = phase === 'rerank' && (p.slug === final[0].slug || p.slug === firstOther);
              const href = featured ? `#${p.slug}` : p.data.url;
              return (
                <li key={p.slug} data-flip={p.slug} style={{ order: pos }} className="story-row">
                  {groupLabel && <p className="mb-1.5 mt-2 text-sm text-muted first:mt-0">{featured ? t('rerank.featured') : t('rerank.alsoBuilt')}</p>}
                  <div className={`grid gap-x-6 gap-y-3 sm:grid-cols-[minmax(0,1fr)_9.5rem] sm:items-start rounded-card px-5 py-3 transition-colors duration-300 ${phase === 'rerank' && featured ? 'bg-surface-2' : 'bg-surface'}`}>
                    <div className="min-w-0">
                      <a href={href} className="inline-flex items-center gap-1.5 text-lg font-medium tracking-tight hover:text-accent">
                        {name(p)}
                        {!featured && <ArrowUpRight className="size-4 text-muted" aria-hidden="true" strokeWidth={1.75} />}
                      </a>
                      <p className="story-summary mt-0.5 text-sm leading-relaxed text-muted">{t(`projects.${p.slug}.summary`)}</p>
                    </div>
                    <div className={`pt-1 transition-opacity duration-300 ${scored ? 'opacity-100' : 'opacity-0'}`}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-mono text-[0.8125rem] tabular-nums">
                          <span className="sr-only">{t('retrieval.score')} </span>
                          {score.toFixed(3)}
                        </span>
                        <span className={`transition-opacity duration-300 ${phase === 'rerank' ? 'opacity-100' : 'opacity-0'}`}>
                          <Delta n={deltas[p.slug]} />
                        </span>
                      </div>
                      <span className="mt-1.5 block">
                        <ScoreBar value={score} show={scored} />
                      </span>
                      <p className="story-matched mt-1.5 truncate text-[0.8125rem] text-muted" title={matchedLabels(p.slug).join(', ')}>
                        {hit ? (
                          <>
                            <span className="sr-only">{t('retrieval.matched')}: </span>
                            {matchedLabels(p.slug).join(', ')}
                          </>
                        ) : (
                          t('retrieval.noMatch')
                        )}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* 03 · Rerank */}
        <Caption stage="rerank" active={phase === 'rerank'} className="pb-24 pt-16 lg:pb-0 lg:pt-0">
          <div ref={rerankRef}>
            <Ghost n={3} />
            <h2 className="relative font-display text-3xl font-light leading-[1.05] tracking-tight">{t('rerank.title')}</h2>
            <p className="relative mt-4 max-w-[46ch] text-muted">{t('rerank.lead')}</p>
            <p className="relative mt-5 max-w-[46ch] text-sm leading-relaxed text-muted">{t('rerank.rule')}</p>
            <a href="#generate" className="relative mt-8 inline-flex items-center gap-2 font-medium text-accent underline-offset-4 hover:underline">
              {t('story.seeCases')}
              <ArrowDown className="size-4" aria-hidden="true" strokeWidth={1.75} />
            </a>
          </div>
        </Caption>
      </div>
    </div>
  );
}
