import { describe, expect, it } from 'vitest';
import { WELCOME_REEL_MS, welcomeMarkup, welcomeSequence } from '../../src/lib/welcome';

describe('welcomeSequence', () => {
  it.each(['en', 'es'] as const)('ends on Welcome whatever the page language (%s)', (locale) => {
    expect(welcomeSequence(locale).at(-1)).toBe('Welcome');
  });

  it.each(['en', 'es'] as const)('shows each word once for %s', (locale) => {
    const seq = welcomeSequence(locale);
    expect(new Set(seq).size).toBe(seq.length);
  });

  // Inter is self-hosted with the latin subset only (U+0000-00FF); anything outside would fall back to another face.
  it('uses only characters the latin font subset covers', () => {
    for (const w of [...welcomeSequence('en'), ...welcomeSequence('es')]) {
      expect([...w].every((ch) => ch.codePointAt(0)! <= 0xff), w).toBe(true);
    }
  });
});

// One reel that slides through every word and slows to a stop on Welcome (a CSS animation, so loading work
// on the main thread cannot make it stutter).
describe('welcomeMarkup', () => {
  const words = welcomeSequence('en');
  const html = welcomeMarkup('en');

  it('has enough words for the reel to slow down gradually', () => {
    expect(words.length).toBeGreaterThanOrEqual(18);
  });

  it('stacks every word in order, Welcome last', () => {
    const shown = [...html.matchAll(/<span class="welcome-word">([^<]+)<\/span>/g)].map((m) => m[1]);
    expect(shown).toEqual(words);
  });

  it('slides the reel up by all but its last word', () => {
    const shift = -((words.length - 1) / words.length) * 100;
    expect(html).toContain('--reel-shift:' + shift.toFixed(3) + '%');
  });

  it('takes its time: the reel runs for 2.5-4 s', () => {
    expect(WELCOME_REEL_MS).toBeGreaterThanOrEqual(2500);
    expect(WELCOME_REEL_MS).toBeLessThanOrEqual(4000);
    expect(html).toContain('--reel-ms:' + WELCOME_REEL_MS + 'ms');
  });
});
