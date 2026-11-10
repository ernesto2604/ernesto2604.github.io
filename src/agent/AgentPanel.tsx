import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Check, LoaderCircle } from 'lucide-react';
import profile from '../content/profile.json';
import DotOrb from '../components/ui/DotOrb';
import TypeLoop from '../components/ui/TypeLoop';
import { localePath, useLocale, useMessages, useT } from '../i18n';
import { MAX_MESSAGE, SUBJECT, isEmail, sendMessage } from '../lib/contact';
import { focusTarget, resolveAnchor, scrollToElement } from '../lib/scroll';
import { fallbackText, matchIntent, type Action } from './match';
import { askLlm } from './llm';
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
  pending?: boolean; // a message being sent: the answer shimmers until it is replaced
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Stage = 'orb' | 'bar' | 'think';
// Writing a message to Ernesto: the next input is the message, then the sender's email.
type Compose = null | 'message' | 'email';

export default function AgentPanel({ dialogRef, opened }: { dialogRef: React.RefObject<HTMLDialogElement | null>; opened: number }) {
  const t = useT();
  const locale = useLocale();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const examples = useMessages().hero.askExamples;
  const [suggestion, setSuggestion] = useState('');
  const [stage, setStage] = useState<Stage>('orb');
  // Bumped on close: a question still streaming checks it and stops.
  const session = useRef(0);
  const [compose, setCompose] = useState<Compose>(null);
  const draft = useRef('');

  // First open: the panel mounts after the lazy chunk loads, so it focuses its own input.
  useEffect(() => inputRef.current?.focus(), []);

  // Each open starts as the orb, which then stretches into the bar. Closing folds it back and forgets the conversation.
  // Reset on every change, not only on close: a close and a quick reopen can land in one render.
  useEffect(() => {
    session.current++;
    setTurns([]);
    setInput('');
    setBusy(false);
    setCompose(null);
    setStage(opened > 0 && reduced ? 'bar' : 'orb');
    if (opened <= 0 || reduced) return;
    const timer = setTimeout(() => setStage('bar'), 380);
    return () => clearTimeout(timer);
  }, [opened]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [turns]);

  const update = (id: number, patch: Partial<Turn>) => setTurns((ts) => ts.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  // A finished turn with no tool calls, for the message steps.
  const say = (question: string, answer: string) => {
    const id = Date.now() + Math.random();
    setTurns((ts) => [...ts, { id, question, calls: [], callsDone: 0, answer, shown: answer.length, actions: [], suggestions: [], done: true }]);
    return id;
  };

  const startCompose = (question: string) => {
    say(question, t('agent.compose.askMessage'));
    setCompose('message');
    inputRef.current?.focus();
  };

  async function composeStep(text: string) {
    if (compose === 'message') {
      draft.current = text.slice(0, MAX_MESSAGE);
      say(text, t('agent.compose.askEmail'));
      setCompose('email');
      return;
    }
    if (!isEmail(text)) {
      say(text, t('agent.compose.badEmail'));
      return;
    }
    setBusy(true);
    const id = say(text, t('agent.compose.sending'));
    update(id, { pending: true });
    const run = session.current;
    let answer: string;
    try {
      await sendMessage({ _subject: SUBJECT, _template: 'table', message: draft.current, email: text.trim() });
      answer = t('agent.compose.sent', { email: text.trim() });
    } catch {
      answer = t('agent.compose.error', { email: profile.email });
    }
    if (run !== session.current) return;
    update(id, { answer, shown: answer.length, pending: false });
    draft.current = '';
    setCompose(null);
    setBusy(false);
    inputRef.current?.focus();
  }

  const cancelCompose = () => {
    say('', t('agent.compose.cancelled'));
    draft.current = '';
    setCompose(null);
    inputRef.current?.focus();
  };

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setInput('');
    if (compose) return composeStep(q);
    const match = matchIntent(q);
    // "I want to send him a message": straight to writing it, no LLM.
    if (match.intent?.id === 'message') return startCompose(q);
    setBusy(true);
    // The LLM answers when /api/agent is reachable; the local matcher still runs for the tool trace, the action
    // buttons and as the answer when the LLM is not available.
    // Message steps (no tool calls) stay out: the sender's message and email are not sent to the LLM.
    const history = turns.filter((x) => x.done && x.calls.length).slice(-3).map((x) => ({ q: x.question, a: x.answer }));
    const llm = askLlm(q, locale, history);
    const local = planTools(match, q);
    const llmCall: ToolCall = { name: 'ask_llm', args: { grounding: 'site facts' }, result: '', ms: 0 };
    const id = Date.now();
    const run = session.current;
    const stale = () => run !== session.current;
    setTurns((ts) => [
      ...ts,
      { id, question: q, calls: [...local, llmCall], callsDone: 0, answer: '', shown: 0, actions: match.actions, suggestions: [], done: false },
    ]);

    if (!reduced) {
      setStage('think');
      for (let i = 0; i < local.length; i++) {
        await sleep(local[i].ms);
        if (stale()) return;
        update(id, { callsDone: i + 1 });
      }
    }
    const reply = await llm;
    if (stale()) return;
    const answer = reply?.answer ?? (match.intent ? match.intent.answer[locale] : fallbackText[locale]);
    update(id, {
      calls: [...local, { ...llmCall, result: reply ? reply.model : 'unavailable → local answer' }],
      callsDone: local.length + 1,
      answer,
      suggestions: reply || match.intent ? [] : match.suggestions[locale],
    });

    if (reduced) {
      update(id, { shown: answer.length, done: true });
    } else {
      setStage('bar');
      // Stream word by word.
      const words = answer.split(/(?<=\s)/);
      let shown = 0;
      for (const w of words) {
        shown += w.length;
        update(id, { shown });
        await sleep(22);
        if (stale()) return;
      }
      update(id, { done: true });
    }
    setBusy(false);
    inputRef.current?.focus();
  }

  function runAction(a: Action) {
    if (a.type === 'compose') return startCompose('');
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
    const id = a.target.slice(1);
    const el = resolveAnchor(id);
    if (!el) return;
    scrollToElement(el);
    focusTarget(id);
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void ask(input);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Tab on an empty field takes the example question on screen; a second Tab moves on as usual.
    if (e.key === 'Tab' && !e.shiftKey && !input && suggestion && !compose) {
      e.preventDefault();
      setInput(suggestion);
      return;
    }
    // Recall the last question, like a shell.
    if (e.key === 'ArrowUp' && !input && turns.length) {
      e.preventDefault();
      setInput(turns.at(-1)!.question);
    }
  };

  const last = turns.at(-1);
  const actionLabel = (a: Action) => t(`agent.targets.${a.type === 'scrollTo' ? a.target.slice(1) : a.target}`);

  return (
    <div className="agent-stack" data-stage={stage}>
      {/* The bar: on open the orb pops in alone and stretches into the bar; while the agent works the bar folds back
          into the orb, which thinks; when the answer streams it opens again for the next question. */}
      <form onSubmit={onSubmit} className="agent-shell glass" data-stage={stage}>
        <DotOrb size={40} mode={stage === 'think' ? 'think' : 'idle'} active={opened > 0} className="agent-orb" />
        <div className="agent-field">
          <label htmlFor="agent-input" className="sr-only">{t('agent.label')}</label>
          <input
            ref={inputRef}
            id="agent-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            readOnly={busy}
            autoComplete="off"
            maxLength={compose === 'message' ? MAX_MESSAGE : 300}
            inputMode={compose === 'email' ? 'email' : undefined}
            aria-describedby="agent-hint"
            className="agent-input"
          />
          {/* Example questions type themselves while the field is empty; Tab takes the one on screen. */}
          <p id="agent-hint" className="sr-only">{t('agent.placeholder')}</p>
          {!input && compose && (
            <span aria-hidden="true" className="agent-hint flex">
              {t(compose === 'message' ? 'agent.compose.messageHint' : 'agent.compose.emailHint')}
            </span>
          )}
          {!input && !compose && (
            <TypeLoop
              items={examples}
              play={opened > 0 && stage === 'bar'}
              onItem={setSuggestion}
              className="agent-hint"
              suffix={<kbd className="kbd-hint agent-key">[Tab]</kbd>}
            />
          )}
        </div>
        <button type="submit" disabled={busy || !input.trim()} className="agent-send">
          <span className="sr-only">{t('agent.send')}</span>
          <span aria-hidden="true">[↵]</span>
        </button>
      </form>

      {turns.length > 0 && (
        // Focusable so keyboard users can scroll a long answer (axe: scrollable-region-focusable).
        <div ref={logRef} tabIndex={0} role="region" aria-label={t('agent.title')} className="agent-card glass" aria-busy={busy}>
          <ol className="grid gap-6">
            {turns.map((turn) => (
              <li key={turn.id} className="grid gap-3">
                {turn.question && (
                  <p className="font-medium">
                    <span className="sr-only">{t('agent.you')}: </span>
                    {turn.question}
                  </p>
                )}
                <div>
                  <ol className="grid gap-1" aria-label={t('agent.working')}>
                    {turn.calls.map((c, i) => {
                      const state = i < turn.callsDone ? 'done' : i === turn.callsDone ? 'running' : 'waiting';
                      if (state === 'waiting') return null;
                      return (
                        <li key={c.name + i} className="flex items-start gap-2 font-mono text-[0.75rem] text-muted">
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
                      <span className={turn.pending ? 'text-shimmer' : undefined}>{turn.answer.slice(0, turn.shown)}</span>
                    </p>
                  )}
                  {turn.done && (turn.actions.length > 0 || turn.suggestions.length > 0) && (
                    <div className="mt-3 flex flex-wrap gap-x-4">
                      {turn.actions.map((a) => (
                          <button key={a.type + a.target} type="button" onClick={() => runAction(a)} className="agent-link text-text">
                            <span aria-hidden="true">[</span>
                            {actionLabel(a)}
                            <span aria-hidden="true">&nbsp;→]</span>
                          </button>
                        ))}
                      {turn.suggestions.map((s) => (
                        <button key={s} type="button" onClick={() => void ask(s)} className="agent-link">
                          <span aria-hidden="true">[</span>
                          {s}
                          <span aria-hidden="true">]</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Announces each answer once, when it is complete, instead of word by word. */}
      <p className="sr-only" aria-live="polite">{last?.done ? last.answer : ''}</p>

      <div className="agent-chrome">
        <details>
          <summary className="agent-link">
            <span aria-hidden="true">[</span>
            {t('agent.howTitle')}
            <span aria-hidden="true">]</span>
          </summary>
          <p className="agent-how">{t('agent.how')}</p>
        </details>
        {compose && !busy && (
          <button type="button" onClick={cancelCompose} className="agent-link">
            <span aria-hidden="true">[</span>
            {t('agent.compose.cancel')}
            <span aria-hidden="true">]</span>
          </button>
        )}
        <button type="button" onClick={() => dialogRef.current?.close()} className="agent-link">
          <span className="sr-only">{t('agent.close')}</span>
          <span aria-hidden="true" className="kbd-hint">[Esc]</span>
          <span aria-hidden="true" className="tap-hint">[{t('agent.close')}]</span>
        </button>
      </div>
    </div>
  );
}