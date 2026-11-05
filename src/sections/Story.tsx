import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import Hologram from '../components/Hologram';
import MorphingText from '../components/ui/MorphingText';
import ScrambleText from '../components/ui/ScrambleText';
import TypeLoop from '../components/ui/TypeLoop';
import ScoreBar from '../components/ScoreBar';
import { useShortcutLabel, openAgent, AGENT_READY } from '../components/Nav';
import { useFlip } from '../hooks/useFlip';
import { useReducedMotion } from '../hooks/useMedia';
import { useLocale, useMessages, useT } from '../i18n';
import { projects, repoIndex, type Project } from '../lib/projects';
import { rerank } from '../lib/rerank';
import { PINNED_QUERY, isPinned, resolveAnchor, scrollToElement } from '../lib/scroll';
import { search, tokenize } from '../lib/search';

type Phase = 'input' | 'retrieval';

// Scroll progress (0..1) through the pinned story (200vh tall, so 100vh of scroll) where each phase starts.
// The anchor sits 0.45 after the start: a marker counts as reached at 45% of the viewport (useActiveStage),
// which is 0.45 of this scroll, so the progress pill flips with the phase.
const PHASE_AT: [Phase, number][] = [['input', 0], ['retrieval', 0.25]];
const ANCHOR_AT = { input: 0, retrieval: 0.7 } as const;

const phaseFor = (p: number): Phase => PHASE_AT.filter(([, at]) => p >= at).at(-1)![0];

function Ghost({ n }: { n: number }) {
  return <span aria-hidden="true" className="ghost-numeral" data-n={String(n).padStart(2, '0')} />;
}

// True once the welcome loader has lifted (public/welcome.js removes html[data-welcome]).
function useWelcomeDone() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const html = document.documentElement;
    const check = () => !html.hasAttribute('data-welcome') && setDone(true);
    const observer = new MutationObserver(check);
    observer.observe(html, { attributes: true, attributeFilter: ['data-welcome'] });
    check();
    return () => observer.disconnect();
  }, []);
  return done;
}

function Caption({ stage, active, className = '', children }: { stage: Phase; active: boolean; className?: string; children: ReactNode }) {
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


export default function Story() {
  const t = useT();
  const shortcut = useShortcutLabel();
  const terms = useMessages().retrieval.terms;
  const askExamples = useMessages().hero.askExamples;
  const locale = useLocale();
  const fmt = (n: number) => (locale === 'es' ? n.toFixed(3).replace('.', ',') : n.toFixed(3));
  const [term, setTerm] = useState<string | null>(null);
  // Server HTML holds the finished state, so no-JS readers and crawlers get scores and the final order.
  const [phase, setPhase] = useState<Phase>('retrieval');
  const [pinned, setPinned] = useState(false);
  const ready = useWelcomeDone();
  const reducedMotion = useReducedMotion();
  // The [ask] tag by the pointer decodes each time the pointer enters the hologram.
  const [askPlay, setAskPlay] = useState(0);
  const replayAsk = () => setAskPlay((n) => n + 1);
  const followPointer = (e: ReactPointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--cx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--cy', `${e.clientY - r.top}px`);
  };
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const root = rootRef.current!;
    const mq = matchMedia(PINNED_QUERY);
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!isPinned()) return setPhase('retrieval');
      const r = root.getBoundingClientRect();
      const total = r.height - innerHeight;
      setPhase(phaseFor(total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onMode = () => {
      document.documentElement.toggleAttribute('data-pinned', mq.matches);
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

  const name = (p: Project) => t(`projects.${p.slug}.name`);
  const { hits, retrieval, final } = useMemo(() => {
    const hits = new Map(search(repoIndex, term ?? terms.join(' ')).map((h) => [h.id, h]));
    const corpus = [...projects].sort((a, b) => t(`projects.${a.slug}.name`).localeCompare(t(`projects.${b.slug}.name`)));
    const retrieval = [...corpus].sort((a, b) => (hits.get(b.slug)?.score ?? 0) - (hits.get(a.slug)?.score ?? 0));
    const final = rerank(projects);
    return { hits, retrieval, final };
  }, [term, terms, t]);

  // All terms shows my preferred order (featured first); a single term re-sorts by its score.
  const ranked = term === null;
  const order = ranked ? final : retrieval;
  const scored = phase !== 'input';
  useFlip(listRef, order.map((p) => p.slug).join());

  // Show the chip labels a hit matched (keeps accents), not the normalized tokens.
  const matchedLabels = (slug: string) => {
    const hit = hits.get(slug);
    if (!hit) return [];
    return (term ? [term] : terms).filter((x) => tokenize(x).some((tok) => hit.matched.includes(tok)));
  };

  const chip = (active: boolean) =>
    `min-h-11 rounded-full px-4 text-sm transition-colors duration-200 ${
      active ? 'bg-accent-fill text-accent-ink' : 'bg-surface-2 text-muted hover:text-text'
    }`;

  const listLabel = ranked ? '' : t('story.results');
  const firstOther = final.find((p) => p.rank === null)?.slug;

  return (
    <div ref={rootRef} className="story relative" data-phase={phase}>
      {(['input', 'retrieval'] as const).map((s) => (
        <span key={s} aria-hidden="true" data-anchor={s} data-stage={s} data-mode="pinned" className="story-marker" style={{ ['--at' as string]: ANCHOR_AT[s] }} />
      ))}

      <div className="story-stage mx-auto max-w-6xl px-5 sm:px-8">
        {/* 01 · Input: the role, who I am, the two ways in, and the hologram. */}
        <Caption stage="input" active={phase === 'input'} className="story-hero grid min-h-[100svh] content-center gap-x-12 gap-y-8 pb-16 pt-24 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center">
          <div className="lg:order-1">
            {/* Loops between my name and my role. The heading's name is the sr-only line; without JS (or with reduced
                motion) it rests on the first text. */}
            <h1 className="hero-title">
              <span className="sr-only">{`${t('hero.greeting')}, ${t('hero.role')}`}</span>
              <MorphingText texts={[t('hero.greeting'), t('hero.role')]} play={ready && !reducedMotion && (!pinned || phase === 'input')} cooldownTime={2.5} />
            </h1>
            <p className="hero-tagline mt-5 sm:mt-6">
              <ScrambleText text={t('hero.valueProp')} play={ready ? 1 : 0} every={11000} />
            </p>
          </div>
          {/* The hologram is the way into the agent: clicking it (or Ctrl/Cmd+K) asks "me". */}
          {AGENT_READY ? (
            // The name comes from the visible label (label-in-name); without JS neither the model nor the agent can run.
            <button type="button" onClick={openAgent} onPointerEnter={replayAsk} onPointerMove={followPointer} aria-keyshortcuts={shortcut === '⌘K' ? 'Meta+K' : 'Control+K'} className="hero-ask no-js-hide lg:order-2">
              <Hologram className="hero-photo" active={(!pinned || phase === 'input') && ready} />
              <span className="sr-only">{t('hero.askHologram')}</span>
              {/* Under the feet: example questions typing in a loop, so the invitation shows without a hover,
                  then how to open it: the shortcut with a keyboard and mouse, a tap on touch screens. */}
              <span className="hero-ask-label">
                <TypeLoop
                  fit
                  items={askExamples}
                  play={ready && (!pinned || phase === 'input')}
                  className="hero-ask-typed"
                  suffix={
                    <>
                      <kbd className="kbd-hint">[{shortcut.replace(' ', ' + ')}]</kbd>
                      <span className="tap-hint">[{t('hero.askTap')}]</span>
                    </>
                  }
                />
              </span>
              {/* Mouse only: an [ask] tag rides next to the pointer over the figure. */}
              <span className="hero-ask-cursor" aria-hidden="true">
                [<ScrambleText text={t('hero.askCursor')} play={askPlay} />]
              </span>
            </button>
          ) : (
            <Hologram className="hero-photo lg:order-2" active={(!pinned || phase === 'input') && ready} />
          )}
          {/* Bottom centre of the first screen (of the pinned stage on wide screens). */}
          <p aria-hidden="true" className="hero-scroll">
            [<ScrambleText text={t('hero.scroll')} play={ready ? 1 : 0} />]
          </p>
        </Caption>
        {/* 02 · Retrieval */}
        <Caption stage="retrieval" active={phase === 'retrieval'} className="pt-24 lg:pt-0">
          {/* The query the scores answer: it opens Retrieval instead of the hero. */}
          <p className="text-sm text-muted">{t('retrieval.queryLabel')}</p>
          <p className="story-query mt-1 mb-10 text-xl font-medium tracking-tight">{t('retrieval.query')}</p>
          <div className="relative">
            <Ghost n={2} />
            <h2 className="relative font-display text-3xl leading-[1.05]">{t('retrieval.title')}</h2>
          </div>
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
          <a href="#generate" className="relative mt-8 inline-flex items-center gap-2 font-medium text-accent underline-offset-4 hover:underline">
            {t('story.seeCases')}
            <ArrowDown className="size-4" aria-hidden="true" strokeWidth={1.75} />
          </a>
          <p className="sr-only" aria-live="polite">
            {term ? `${term}: ${retrieval.filter((p) => hits.has(p.slug)).map(name).join(', ')}` : ''}
          </p>
        </Caption>

        {/* Result set: order changes with the chosen term; DOM order is the final ranking. */}
        <div className="story-list-wrap pt-10">
          <p className="mb-4 min-h-5 text-sm text-muted" aria-hidden="true">{listLabel}</p>
          <ol ref={listRef} className="flex flex-col gap-2">
            {final.map((p) => {
              const hit = hits.get(p.slug);
              const score = hit?.score ?? 0;
              const featured = p.rank !== null;
              const pos = order.indexOf(p);
              const groupLabel = ranked && (p.slug === final[0].slug || p.slug === firstOther);
              const href = featured ? `#${p.slug}` : p.data.url;
              return (
                <li key={p.slug} data-flip={p.slug} style={{ order: pos }} className="story-row">
                  {groupLabel && <p className="mb-1.5 mt-2 text-sm text-muted first:mt-0">{featured ? t('rerank.featured') : t('rerank.alsoBuilt')}</p>}
                  <div className={`grid gap-x-6 gap-y-3 sm:grid-cols-[minmax(0,1fr)_9.5rem] sm:items-start rounded-card px-5 py-3 transition-colors duration-300 ${ranked && !featured ? 'bg-surface-2' : 'bg-surface'}`}>
                    <div className="min-w-0">
                      <a href={href} className="inline-flex items-center gap-1.5 text-lg font-medium tracking-tight hover:text-accent">
                        {name(p)}
                        {!featured && <ArrowUpRight className="size-4 text-muted" aria-hidden="true" strokeWidth={1.75} />}
                      </a>
                      <p className="story-summary mt-0.5 text-sm leading-relaxed text-muted">{t(`projects.${p.slug}.summary`)}</p>
                    </div>
                    <div className={`pt-1 transition-opacity duration-300 ${scored ? 'opacity-100' : 'opacity-0'}`}>
                      <span className="font-mono text-[0.8125rem] tabular-nums">
                        <span className="sr-only">{t('retrieval.score')} </span>
                        {fmt(score)}
                      </span>
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

      </div>
    </div>
  );
}
