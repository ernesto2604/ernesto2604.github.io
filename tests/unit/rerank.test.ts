import { describe, expect, it } from 'vitest';
import { rankDeltas, rerank } from '../../src/lib/rerank';

const p = (slug: string, rank: number | null, updatedAt: string) => ({ slug, rank, data: { updatedAt } });

const projects = [
  p('ring', 1, '2026-10-23'),
  p('rag', 2, '2026-09-24'),
  p('wake', 3, '2026-05-21'),
  p('hub', null, '2026-02-12'),
  p('auth', null, '2026-02-11'),
  p('churros', null, '2026-04-10'),
];

describe('rerank', () => {
  it('puts featured projects first by rank, then the rest by most recent update', () => {
    expect(rerank(projects).map((x) => x.slug)).toEqual(['ring', 'rag', 'wake', 'churros', 'hub', 'auth']);
  });
});

describe('rankDeltas', () => {
  it('reports how far each item moved from its retrieval position (positive = up)', () => {
    const retrieval = ['auth', 'ring', 'hub', 'rag', 'wake', 'churros'];
    const final = ['ring', 'rag', 'wake', 'churros', 'hub', 'auth'];
    expect(rankDeltas(retrieval, final)).toEqual({ ring: 1, rag: 2, wake: 2, churros: 2, hub: -2, auth: -5 });
  });

  it('is zero for an unchanged order', () => {
    expect(rankDeltas(['a', 'b'], ['a', 'b'])).toEqual({ a: 0, b: 0 });
  });
});
