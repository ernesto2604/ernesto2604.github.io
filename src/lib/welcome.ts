import greetings from '../content/greetings.json';
import type { Locale } from '../i18n';

// Welcome loader (public/welcome.js plays it; scripts/prerender.mjs writes the words into each page).
// Every word sits in one reel that slides up and slows to a stop on Welcome, like a wheel coming to rest;
// then the view dives into the counter of its "o" and comes out on the hero.
export const WELCOME_REEL_MS = 3400; // the reel, from the first word to Welcome
export const WELCOME_HOLD_MS = 500; // Welcome stays still before the dive
export const WELCOME_ZOOM_MS = 2400; // the dive itself

// Every other language once, then Welcome last, on every page.
export function welcomeSequence(_locale: Locale): string[] {
  const last = greetings.words.find((g) => g.lang === 'en')!;
  return [...greetings.words.filter((g) => g !== last).map((g) => g.word), last.word];
}

// Overlay markup, written into each page by scripts/prerender.mjs and by the dev server (vite.config.ts).
// Hidden unless boot.js sets html[data-welcome]; decorative, so screen readers skip it. The reel is a CSS
// animation that starts with the first paint; --reel-shift moves it up by all but its last word.
export function welcomeMarkup(locale: Locale): string {
  const words = welcomeSequence(locale);
  const shift = (-((words.length - 1) / words.length) * 100).toFixed(3);
  const reel = words.map((w) => `<span class="welcome-word">${w}</span>`).join('');
  return `<div id="welcome" aria-hidden="true" data-hold="${WELCOME_HOLD_MS}" style="--reel-ms:${WELCOME_REEL_MS}ms;--reel-shift:${shift}%;--zoom-ms:${WELCOME_ZOOM_MS}ms"><span class="welcome-window"><span class="welcome-reel">${reel}</span></span></div>`;
}
