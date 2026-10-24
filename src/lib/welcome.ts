import greetings from '../content/greetings.json';
import type { Locale } from '../i18n';

// Welcome loader (public/welcome.js plays it; scripts/prerender.mjs writes the words into each page).
export const WELCOME_STEP_MS = 190;

// Every other language once, then the page's own language last so the loader lands on it.
export function welcomeSequence(locale: Locale): string[] {
  const own = greetings.words.find((g) => g.lang === locale)!;
  return [...greetings.words.filter((g) => g !== own).map((g) => g.word), own.word];
}
