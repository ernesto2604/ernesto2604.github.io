import { describe, expect, it } from 'vitest';
import { fetchRepos } from '../../scripts/fetch-repos.mjs';

const fallback = [{ name: 'from-fallback' }];
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('fetchRepos', () => {
  it('returns the fallback with a warning when the network fails', async () => {
    const result = await fetchRepos({
      names: ['a'],
      fallback,
      fetchImpl: async () => {
        throw new Error('offline');
      },
    });
    expect(result.repos).toBe(fallback);
    expect(result.warning).toMatch(/offline/);
  });

  it('returns the fallback when GitHub rate-limits', async () => {
    const result = await fetchRepos({ names: ['a'], fallback, fetchImpl: async () => json({ message: 'rate limit' }, 403) });
    expect(result.repos).toBe(fallback);
    expect(result.warning).toMatch(/403/);
  });

  it('keeps only listed repos, in list order, with languages', async () => {
    const list = [
      { name: 'b', description: 'B', html_url: 'https://github.com/x/b', homepage: '', topics: ['t'], stargazers_count: 2, pushed_at: '2026-01-02T00:00:00Z' },
      { name: 'other', description: '', html_url: '', homepage: null, topics: [], stargazers_count: 0, pushed_at: '2026-01-01T00:00:00Z' },
      { name: 'a', description: null, html_url: 'https://github.com/x/a', homepage: null, topics: [], stargazers_count: 0, pushed_at: '2026-01-03T00:00:00Z' },
    ];
    const fetchImpl = async (url: string | URL | Request) => (String(url).includes('/languages') ? json({ Python: 100 }) : json(list));
    const result = await fetchRepos({ names: ['a', 'b'], fallback, fetchImpl });
    expect(result.warning).toBeUndefined();
    expect(result.repos.map((r: { name: string }) => r.name)).toEqual(['a', 'b']);
    expect(result.repos[1]).toEqual({
      name: 'b',
      description: 'B',
      url: 'https://github.com/x/b',
      homepage: '',
      languages: { Python: 100 },
      topics: ['t'],
      stars: 2,
      updatedAt: '2026-01-02T00:00:00Z',
    });
  });

  it('falls back when a listed repo is missing from the API answer', async () => {
    const result = await fetchRepos({ names: ['missing'], fallback, fetchImpl: async () => json([]) });
    expect(result.repos).toBe(fallback);
    expect(result.warning).toMatch(/missing/);
  });
});
