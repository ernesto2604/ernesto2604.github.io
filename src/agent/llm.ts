import profile from '../content/profile.json';
import type { Locale } from '../i18n';

export type LlmReply = { answer: string; model: string };

const TIMEOUT_MS = 12000;
// The GitHub Pages mirror has no functions: it asks the one on the canonical Cloudflare site.
const endpoint = () => (location.hostname.endsWith('github.io') ? new URL('api/agent', profile.siteUrl).href : '/api/agent');

// Asks functions/api/agent.ts. Resolves null on any failure (no function deployed, rate limit, timeout, offline),
// so the caller can fall back to the local matcher.
export async function askLlm(question: string, locale: Locale, history: { q: string; a: string }[]): Promise<LlmReply | null> {
  try {
    const res = await fetch(endpoint(), {
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
