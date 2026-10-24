import greetings from '../content/greetings.json';
import type { Locale } from '../i18n';

// Welcome loader (public/welcome.js plays it; scripts/prerender.mjs writes the words into each page).
export const WELCOME_STEP_MS = 190;

// Every other language once, then the page's own language last so the loader lands on it.
export function welcomeSequence(locale: Locale): string[] {
  const own = greetings.words.find((g) => g.lang === locale)!;
  return [...greetings.words.filter((g) => g !== own).map((g) => g.word), own.word];
}

// Overlay markup, written into each page by scripts/prerender.mjs and by the dev server (vite.config.ts).
// Hidden unless boot.js sets html[data-welcome]; decorative, so screen readers skip it.
export function welcomeMarkup(locale: Locale): string {
  const words = welcomeSequence(locale);
  return `<div id="welcome" aria-hidden="true" data-words='${JSON.stringify(words)}' data-step="${WELCOME_STEP_MS}"><span class="welcome-word">${words[0]}</span></div>`;
}