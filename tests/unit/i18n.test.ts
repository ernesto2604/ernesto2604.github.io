import { describe, expect, it } from 'vitest';
import en from '../../src/content/en.json';
import es from '../../src/content/es.json';
import { translate } from '../../src/i18n/translate';

type Tree = { [k: string]: string | Tree | Tree[] | string[] };

function flatten(tree: unknown, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  if (typeof tree === 'string') {
    out[prefix] = tree;
    return out;
  }
  for (const [k, v] of Object.entries(tree as Tree)) {
    Object.assign(out, flatten(v, prefix ? `${prefix}.${k}` : k));
  }
  return out;
}

const flatEn = flatten(en);
const flatEs = flatten(es);
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('locale files', () => {
  it('have identical key sets', () => {
    expect(Object.keys(flatEs).sort()).toEqual(Object.keys(flatEn).sort());
  });

  it('have no empty strings', () => {
    const empty = [...Object.entries(flatEn), ...Object.entries(flatEs)].filter(([, v]) => !v.trim());
    expect(empty).toEqual([]);
  });

  it('use the same {placeholders} per key', () => {
    const mismatched = Object.keys(flatEn).filter(
      (k) => placeholders(flatEn[k]).join() !== placeholders(flatEs[k] ?? '').join(),
    );
    expect(mismatched).toEqual([]);
  });
});

describe('translate', () => {
  it('resolves nested keys and interpolates vars', () => {
    const dict = { a: { b: 'Hello {name}' } };
    expect(translate(dict, 'a.b', { name: 'Ada' })).toBe('Hello Ada');
  });

  it('throws on a missing key', () => {
    expect(() => translate({ a: 'x' }, 'a.missing')).toThrow(/a\.missing/);
  });
});
