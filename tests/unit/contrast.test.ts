import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { contrastRatio } from '../../src/lib/contrast';

const css = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');
const token = (name: string) => {
  const m = css.match(new RegExp(String.raw`--${name}:\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`token --${name} not found`);
  return m[1];
};

describe('contrastRatio', () => {
  it('is 21 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
  });
  it('is 1 for identical colors', () => {
    expect(contrastRatio('#11161f', '#11161f')).toBe(1);
  });
});

describe('design tokens meet WCAG AA', () => {
  const pairs: [string, string, number][] = [
    ['text', 'bg-0', 4.5],
    ['text', 'surface-2', 4.5],
    ['text-muted', 'bg-0', 4.5],
    ['text-muted', 'surface', 4.5],
    ['text-muted', 'surface-2', 4.5],
    ['text-muted', 'bg-1', 4.5],
    // --accent is the text/icon/focus-ring shade; --accent-fill is for fills that carry --accent-ink text.
    ['accent', 'bg-0', 4.5],
    ['accent', 'surface', 4.5],
    ['accent', 'surface-2', 4.5],
    ['accent-ink', 'accent-fill', 4.5],
    ['ok', 'bg-0', 4.5],
    ['line-strong', 'surface', 3],
  ];
  it('is a light palette (page lighter than text)', () => {
    const sum = (hex: string) => [1, 3, 5].reduce((s, i) => s + parseInt(hex.slice(i, i + 2), 16), 0);
    expect(sum(token('bg-0'))).toBeGreaterThan(sum(token('text')));
  });
  it.each(pairs)('%s on %s ≥ %d', (fg, bg, min) => {
    expect(contrastRatio(token(fg), token(bg))).toBeGreaterThanOrEqual(min);
  });
});
