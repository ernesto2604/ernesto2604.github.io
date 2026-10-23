import { describe, expect, it } from 'vitest';
import { createIndex, editDistance, normalize, search, tokenize } from '../../src/lib/search';

const doc = (id: string, text: string, weight = 1) => ({ id, fields: [{ text, weight }] });

describe('normalize / tokenize', () => {
  it('folds accents and case', () => {
    expect(normalize('Telemetría ÚNICA')).toBe('telemetria unica');
  });

  it('drops English and Spanish stopwords and punctuation', () => {
    expect(tokenize('Who is Ernesto, and what has he built?')).toEqual(['ernesto', 'built']);
    expect(tokenize('¿Qué proyectos de IA tiene?')).toEqual(['proyectos', 'ia']);
  });
});

describe('editDistance', () => {
  it('counts a transposition as one edit', () => {
    expect(editDistance('stakc', 'stack')).toBe(1);
  });
  it('counts insertions and substitutions', () => {
    expect(editDistance('telemtry', 'telemetry')).toBe(1);
    expect(editDistance('kitten', 'sitting')).toBe(3);
  });
});

describe('search', () => {
  const index = createIndex([
    doc('ring', 'diagnostic agent telemetry opencv bedrock python'),
    doc('rag', 'hybrid retrieval pgvector rrf python api'),
    doc('auth', 'secure authentication go sqlite'),
  ]);

  it('ranks the document containing the query term first', () => {
    expect(search(index, 'pgvector')[0].id).toBe('rag');
  });

  it('matches accented queries against plain text', () => {
    expect(search(index, 'telemetría')[0].id).toBe('ring');
  });

  it('tolerates a one-letter typo on longer words', () => {
    expect(search(index, 'telemtry')[0].id).toBe('ring');
  });

  it('does not fuzzy-match short tokens', () => {
    expect(search(index, 'gp')).toEqual([]);
  });

  it('matches prefixes of 4+ characters', () => {
    expect(search(index, 'authent')[0].id).toBe('auth');
  });

  it('weights rare terms above common ones (IDF)', () => {
    const hits = search(index, 'python bedrock');
    expect(hits[0].id).toBe('ring');
    expect(hits[0].score).toBe(1);
    expect(hits[1].score).toBeLessThan(1);
  });

  it('reports which query terms matched', () => {
    expect(search(index, 'rrf retrieval')[0].matched.sort()).toEqual(['retrieval', 'rrf']);
  });

  it('respects field weights', () => {
    const weighted = createIndex([
      { id: 'title', fields: [{ text: 'agent', weight: 3 }] },
      { id: 'body', fields: [{ text: 'agent', weight: 1 }] },
    ]);
    expect(search(weighted, 'agent')[0].id).toBe('title');
  });

  it('returns nothing for empty or stopword-only queries', () => {
    expect(search(index, '')).toEqual([]);
    expect(search(index, 'the and de la')).toEqual([]);
  });

  it('handles very long input without throwing', () => {
    expect(() => search(index, 'retrieval '.repeat(200))).not.toThrow();
  });

  it('limits the number of hits', () => {
    expect(search(index, 'python', { limit: 1 })).toHaveLength(1);
  });
});
