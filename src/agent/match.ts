import kb from '../content/agent/kb.json';
import type { Locale } from '../i18n';
import { createIndex, search, type Hit } from '../lib/search';

export type Action = { type: 'scrollTo' | 'highlight' | 'switchLocale'; target: string };
export type Intent = {
  id: string;
  project?: string;
  // Generic intents get a lower weight so specific ones win when both match.
  weight?: number;
  // What search_projects looks up for this intent, when the user's words are too generic.
  searchQuery?: string;
  triggers: string[];
  tools: string[];
  answer: Record<Locale, string>;
  actions?: Action[];
};
export type Match = { intent: Intent | null; score: number; hits: Hit[]; suggestions: Record<Locale, string[]> };

const intents = kb.intents as Intent[];
// Triggers of both languages are indexed together, so mixed-language questions still match.
const index = createIndex(intents.map((i) => ({ id: i.id, fields: [{ text: i.triggers.join(' '), weight: i.weight ?? 1 }] })));

// Minimum absolute BM25 score for an answer; below it the agent admits it does not know.
export const MIN_SCORE = 0.9;
const MAX_QUERY = 300;

export function matchIntent(query: string): Match {
  const hits = search(index, query.slice(0, MAX_QUERY), { limit: 3 });
  const top = hits[0];
  const intent = top && top.raw >= MIN_SCORE ? intents.find((i) => i.id === top.id)! : null;
  return { intent, score: top?.raw ?? 0, hits, suggestions: kb.suggestions };
}

export const fallbackText = kb.fallback as Record<Locale, string>;
