import { describe, expect, it } from 'vitest';
import { WELCOME_STEP_MS, welcomeSequence } from '../../src/lib/welcome';

describe('welcomeSequence', () => {
  it.each([
    ['en', 'Welcome'],
    ['es', 'Bienvenido'],
  ] as const)('ends on the active language for %s', (locale, last) => {
    expect(welcomeSequence(locale).at(-1)).toBe(last);
  });

  it.each(['en', 'es'] as const)('shows each word once for %s', (locale) => {
    const seq = welcomeSequence(locale);
    expect(new Set(seq).size).toBe(seq.length);
  });

  it('fits the 1.5-2 s budget at the step duration', () => {
    const total = welcomeSequence('en').length * WELCOME_STEP_MS;
    expect(WELCOME_STEP_MS).toBeGreaterThanOrEqual(150);
    expect(WELCOME_STEP_MS).toBeLessThanOrEqual(250);
    expect(total).toBeGreaterThanOrEqual(1500);
    expect(total).toBeLessThanOrEqual(2000);
  });

  // Inter is self-hosted with the latin subset only (U+0000-00FF); anything outside would fall back to another face.
  it('uses only characters the latin font subset covers', () => {
    for (const w of [...welcomeSequence('en'), ...welcomeSequence('es')]) {
      expect([...w].every((ch) => ch.codePointAt(0)! <= 0xff), w).toBe(true);
    }
  });
});
