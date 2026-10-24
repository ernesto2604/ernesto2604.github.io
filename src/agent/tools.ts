import profile from '../content/profile.json';
import { DIAGRAMS } from '../components/diagrams';
import { featured, projects, repoIndex, shortDate } from '../lib/projects';
import { search } from '../lib/search';
import { MIN_SCORE, type Match } from './match';

export type ToolCall = { name: string; args: Record<string, string>; result: string; ms: number };

// Simulated latency, proportional to the amount of data the lookup touched.
const duration = (units: number) => Math.min(900, 240 + units * 70);

function readRepo(slug: string): ToolCall {
  const p = projects.find((x) => x.slug === slug)!;
  const langs = Object.entries(p.data.languages);
  const total = langs.reduce((s, [, v]) => s + v, 0) || 1;
  const top = langs.sort((a, b) => b[1] - a[1]).slice(0, 2).map(([n, v]) => `${n} ${Math.round((v / total) * 100)}%`);
  return {
    name: 'read_repo',
    args: { repo: p.data.name },
    result: `${top.join(', ')} · last push ${shortDate(p.data.updatedAt)}`,
    ms: duration(langs.length),
  };
}

// Every call reports what was actually looked up in the site's local data.
export function planTools(match: Match, query: string): ToolCall[] {
  const q = query.trim().slice(0, 80);
  const calls: ToolCall[] = [
    {
      name: 'match_intent',
      args: { query: q },
      result: match.intent
        ? `${match.intent.id} (score ${match.score.toFixed(2)})`
        : `no intent ≥ ${MIN_SCORE} (best ${match.score.toFixed(2)})`,
      ms: duration(match.hits.length),
    },
  ];
  const intent = match.intent;
  if (!intent) return calls;

  for (const tool of intent.tools) {
    if (tool === 'search_projects') {
      const lookup = intent.searchQuery ?? intent.project ?? q;
      const hits = search(repoIndex, lookup, { limit: 3 });
      calls.push({
        name: 'search_projects',
        args: { query: lookup.slice(0, 80) },
        result: hits.length
          ? hits.map((h) => `${h.id} ${h.score.toFixed(3)}`).join(', ')
          : `no lexical match; featured: ${featured.map((p) => p.slug).join(', ')}`,
        ms: duration(hits.length || featured.length),
      });
    } else if (tool === 'read_repo' && intent.project) {
      calls.push(readRepo(intent.project));
    } else if (tool === 'show_architecture' && intent.project) {
      const spec = DIAGRAMS[intent.project];
      calls.push({
        name: 'show_architecture',
        args: { project: intent.project },
        result: `${spec.nodes.length} components, ${spec.edges.length} connections`,
        ms: duration(spec.nodes.length / 2),
      });
    } else if (tool === 'get_profile') {
      calls.push({ name: 'get_profile', args: {}, result: `${profile.name} · ${profile.location.city}, ${profile.location.country}`, ms: duration(2) });
    } else if (tool === 'get_contact') {
      const channels = ['email', 'message form', 'linkedin', 'github'];
      calls.push({ name: 'get_contact', args: {}, result: channels.join(', '), ms: duration(channels.length) });
    }
  }
  return calls;
}
