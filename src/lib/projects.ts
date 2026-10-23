import { projects, type Project } from '../data/repos';
import { createIndex } from './search';

export { projects, type Project };

export const featured = projects.filter((p) => p.rank !== null).sort((a, b) => a.rank! - b.rank!);
export const others = projects
  .filter((p) => p.rank === null)
  .sort((a, b) => b.data.updatedAt.localeCompare(a.data.updatedAt));

// Retrieval corpus: curated tags weigh most, then stack, then GitHub description/topics/languages.
export const repoIndex = createIndex(
  projects.map((p) => ({
    id: p.slug,
    fields: [
      { text: p.tags.join(' '), weight: 3 },
      { text: p.stack.join(' '), weight: 2 },
      { text: [p.data.description, p.data.topics.join(' '), Object.keys(p.data.languages).join(' ')].join(' '), weight: 1 },
    ],
  })),
);

export function topLanguage(p: Project): { name: string; pct: number } | null {
  const entries = Object.entries(p.data.languages);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (!total) return null;
  const [name, bytes] = entries.sort((a, b) => b[1] - a[1])[0];
  return { name, pct: Math.round((bytes / total) * 100) };
}

export const shortDate = (iso: string) => iso.slice(0, 10);
