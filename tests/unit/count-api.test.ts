import { describe, expect, it } from 'vitest';
import { onRequestPost } from '../../functions/api/count';

// Records the counts inserts; the rate-limit row answers with `hits`.
const fakeDb = (hits = 1) => {
  const calls: (string | number)[][] = [];
  return {
    calls,
    prepare: (sql: string) => ({
      bind: (...v: (string | number)[]) => ({
        run: async () => (sql.includes('counts') ? calls.push(v) : 0),
        first: async <T,>() => ({ n: hits }) as T,
      }),
    }),
  };
};
const post = (body: string, origin?: string) =>
  new Request('https://ernesto2406.pages.dev/api/count', { method: 'POST', headers: origin ? { origin } : {}, body });

describe('count api', () => {
  it('counts per event, language and site', async () => {
    const DB = fakeDb();
    const ok = await onRequestPost({ request: post('{"event":"view","lang":"es"}', 'https://ernesto2406.pages.dev'), env: { DB } });
    const mirror = await onRequestPost({ request: post('{"event":"get","lang":"en"}', 'https://ernesto2604.github.io'), env: { DB } });
    expect([ok.status, mirror.status]).toEqual([204, 204]);
    expect(DB.calls).toEqual([['view', 'es', 'pages'], ['get', 'en', 'github']]);
  });

  it('rejects other sites, bad bodies and a missing database', async () => {
    const DB = fakeDb();
    const site = 'https://ernesto2406.pages.dev';
    expect((await onRequestPost({ request: post('{"event":"view","lang":"es"}', 'https://evil.example'), env: { DB } })).status).toBe(403);
    expect((await onRequestPost({ request: post('{"event":"view","lang":"es"}'), env: { DB } })).status).toBe(403);
    expect((await onRequestPost({ request: post('{"event":"hack","lang":"es"}', site), env: { DB } })).status).toBe(400);
    expect((await onRequestPost({ request: post('nope', site), env: { DB } })).status).toBe(400);
    expect((await onRequestPost({ request: post('{"event":"view","lang":"es"}', site), env: {} })).status).toBe(503);
    expect(DB.calls).toEqual([]);
  });

  it('stops counting past the hourly limit per IP', async () => {
    const DB = fakeDb(21);
    const res = await onRequestPost({ request: post('{"event":"view","lang":"es"}', 'https://ernesto2406.pages.dev'), env: { DB } });
    expect(res.status).toBe(429);
    expect(DB.calls).toEqual([]);
  });
});
