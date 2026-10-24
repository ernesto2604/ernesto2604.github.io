import { describe, expect, it } from 'vitest';
import { rerank } from '../../src/lib/rerank';

const p = (slug: string, rank: number | null, updatedAt: string) => ({ slug, rank, data: { updatedAt } });

const projects = [
  p('ring', 1, '2026-10-23'),
  p('rag', 2, '2026-09-24'),
  p('wake', 3, '2026-05-21'),
  p('hub', null, '2026-02-12'),
  p('auth', null, '2026-02-11'),
];

describe('rerank', () => {
  it('puts featured projects first by rank, then the rest by most recent update', () => {
    expect(rerank(projects).map((x) => x.slug)).toEqual(['ring', 'rag', 'wake', 'hub', 'auth']);
  });
});

