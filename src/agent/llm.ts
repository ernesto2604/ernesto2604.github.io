import type { Locale } from '../i18n';

export type LlmReply = { answer: string; model: string };

const TIMEOUT_MS = 12000;

// Asks functions/api/agent.ts. Resolves null on any failure (no function deployed, rate limit, timeout, offline),
// so the caller can fall back to the local matcher.
export async function askLlm(question: string, locale: Locale, history: { q: string; a: string }[]): Promise<LlmReply | null> {
  try {
    const res = await fetch('/api/agent', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question, locale, history }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<LlmReply>;
    return typeof data.answer === 'string' && data.answer ? { answer: data.answer, model: data.model ?? 'llm' } : null;
  } catch {
    return null;
  }
}
