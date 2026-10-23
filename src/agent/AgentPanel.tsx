import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { ArrowRight, Check, CornerDownLeft, LoaderCircle, X } from 'lucide-react';
import { localePath, useLocale, useT } from '../i18n';
import { resolveAnchor, scrollToElement } from '../lib/scroll';
import { fallbackText, matchIntent, type Action } from './match';
import { planTools, type ToolCall } from './tools';

type Turn = {
  id: number;
  question: string;
  calls: ToolCall[];
  callsDone: number;
  answer: string;
  shown: number; // characters of the answer streamed so far
  actions: Action[];
  suggestions: string[];
  done: boolean;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function AgentPanel({ dialogRef }: { dialogRef: React.RefObject<HTMLDialogElement | null> }) {
  const t = useT();
  const locale = useLocale();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const suggestions = matchIntent('').suggestions[locale];

  // First open: the panel mounts after the lazy chunk loads, so it focuses its own input.
  useEffect(() => inputRef.current?.focus(), []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [turns]);

  const update = (id: number, patch: Partial<Turn>) => setTurns((ts) => ts.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setBusy(true);
    setInput('');
    const match = matchIntent(q);
    const calls = planTools(match, q);
    const answer = match.intent ? match.intent.answer[locale] : fallbackText[locale];
    const id = Date.now();
    setTurns((ts) => [
      ...ts,
      { id, question: q, calls, callsDone: 0, answer, shown: 0, actions: match.intent?.actions ?? [], suggestions: match.intent ? [] : match.suggestions[locale], done: false },
    ]);

    if (reduced) {
      update(id, { callsDone: calls.length, shown: answer.length, done: true });
    } else {
      for (let i = 0; i < calls.length; i++) {
        await sleep(calls[i].ms);
        update(id, { callsDone: i + 1 });
      }
      // Stream word by word.
      const words = answer.split(/(?<=\s)/);
      let shown = 0;
      for (const w of words) {
        shown += w.length;
        update(id, { shown });
        await sleep(22);
      }
      update(id, { done: true });
    }
    setBusy(false);
    inputRef.current?.focus();
  }

  function runAction(a: Action) {
    if (a.type === 'switchLocale') {
      try {
        localStorage.setItem('locale', a.target);
      } catch {
        /* storage blocked */
      }
      location.href = localePath(a.target as 'en' | 'es');
      return;
    }
    dialogRef.current?.close();
    const el = resolveAnchor(a.target.slice(1));
    if (!el) return;
    scrollToElement(el);
    const highlight = turns.at(-1)?.actions.find((x) => x.type === 'highlight');
    if (highlight) {
      const target = document.querySelector(highlight.target);
      target?.classList.add('flash');
      setTimeout(() => target?.classList.remove('flash'), 2600);
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void ask(input);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Recall the last question, like a shell.
    if (e.key === 'ArrowUp' && !input && turns.length) {
      e.preventDefault();
      setInput(turns.at(-1)!.question);
    }
  };

  const last = turns.at(-1);
  const actionLabel = (a: Action) => t(`agent.targets.${a.type === 'switchLocale' ? a.target : a.target.slice(1)}`);

  return (
    <div className="flex max-h-[min(80svh,720px)] flex-col">
      <header className="flex items-center justify-between gap-4 px-5 pb-3 pt-4">
        <h2 id="agent-title" className="font-medium">{t('agent.title')}</h2>
        <button type="button" onClick={() => dialogRef.current?.close()} className="grid size-11 place-items-center rounded-full text-muted hover:bg-white/5 hover:text-text" aria-label={t('agent.close')}>
          <X className="size-5" aria-hidden="true" strokeWidth={1.75} />
        </button>
      </header>

      <div ref={logRef} className="min-h-0 flex-1 overflow-y-auto px-5" aria-busy={busy}>
        {turns.length === 0 && (
          <div className="pb-4">
            <p className="text-sm text-muted">{t('agent.suggestions')}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <li key={s}>
                  <button type="button" onClick={() => void ask(s)} className="min-h-11 rounded-full bg-surface-2 px-4 text-sm hover:bg-line">
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <ol className="grid gap-6 pb-4">
          {turns.map((turn) => (
            <li key={turn.id} className="grid gap-3">
              <p className="justify-self-end rounded-2xl bg-surface-2 px-4 py-2.5">
                <span className="sr-only">{t('agent.you')}: </span>
                {turn.question}
              </p>
              <div>
                <ol className="grid gap-1" aria-label={t('agent.working')}>
                  {turn.calls.map((c, i) => {
                    const state = i < turn.callsDone ? 'done' : i === turn.callsDone ? 'running' : 'waiting';
                    if (state === 'waiting') return null;
                    return (
                      <li key={c.name + i} className="flex items-start gap-2 font-mono text-[0.8125rem] text-muted">
                        {state === 'done' ? (
                          <Check className="mt-0.5 size-3.5 shrink-0 text-ok" aria-hidden="true" />
                        ) : (
                          <LoaderCircle className="mt-0.5 size-3.5 shrink-0 animate-spin text-accent" aria-hidden="true" />
                        )}
                        <span className="min-w-0 break-words">
                          <span className="text-text">{c.name}</span>({Object.values(c.args).map((v) => JSON.stringify(v)).join(', ')})
                          {state === 'done' && <span> → {c.result}</span>}
                        </span>
                      </li>
                    );
                  })}
                </ol>
                {turn.shown > 0 && (
                  <p className="mt-3 leading-relaxed" aria-hidden={!turn.done}>
                    <span className="sr-only">{t('agent.assistant')}: </span>
                    {turn.answer.slice(0, turn.shown)}
                  </p>
                )}
                {turn.done && (turn.actions.some((a) => a.type !== 'highlight') || turn.suggestions.length > 0) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {turn.actions
                      .filter((a) => a.type !== 'highlight')
                      .map((a) => (
                        <button key={a.type + a.target} type="button" onClick={() => runAction(a)} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-accent-ink">
                          {actionLabel(a)}
                          <ArrowRight className="size-4" aria-hidden="true" strokeWidth={2} />
                        </button>
                      ))}
                    {turn.suggestions.map((s) => (
                      <button key={s} type="button" onClick={() => void ask(s)} className="min-h-11 rounded-full bg-surface-2 px-4 text-sm hover:bg-line">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Announces each answer once, when it is complete, instead of word by word. */}
      <p className="sr-only" aria-live="polite">{last?.done ? last.answer : ''}</p>

      <form onSubmit={onSubmit} className="flex items-center gap-2 px-4 pb-3 pt-2">
        <label htmlFor="agent-input" className="sr-only">{t('agent.label')}</label>
        <input
          ref={inputRef}
          id="agent-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t('agent.placeholder')}
          autoComplete="off"
          maxLength={300}
          className="h-12 min-w-0 flex-1 rounded-full bg-bg-0/70 px-5 text-base placeholder:text-muted focus-visible:outline-2"
        />
        <button type="submit" disabled={busy || !input.trim()} className="inline-flex h-12 min-w-12 items-center justify-center gap-2 rounded-full bg-accent px-3.5 font-medium text-accent-ink disabled:opacity-60 sm:px-5">
          <span className="sr-only sm:not-sr-only">{t('agent.send')}</span>
          <CornerDownLeft className="size-4" aria-hidden="true" strokeWidth={2} />
        </button>
      </form>

      <details className="px-5 pb-4 text-sm text-muted">
        <summary className="inline-flex min-h-11 cursor-pointer items-center hover:text-text">{t('agent.howTitle')}</summary>
        <p className="mt-1 leading-relaxed">{t('agent.how')}</p>
        <a href="https://github.com/ernesto2604/ernesto2604.github.io/tree/main/src/agent" className="mt-2 inline-flex min-h-11 items-center text-accent underline-offset-4 hover:underline">
          {t('agent.source')}
        </a>
      </details>
    </div>
  );
}
