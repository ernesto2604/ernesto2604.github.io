// Shared scrolling helpers: pinned-story mode, anchor resolution and smooth scrolling.

// Must match the media query in public/boot.js, which sets html[data-pinned] before first paint.
export const PINNED_QUERY = '(min-width: 1024px) and (min-height: 740px) and (prefers-reduced-motion: no-preference)';

export const isPinned = () => document.documentElement.hasAttribute('data-pinned');

type Scroller = { scrollTo(target: number, opts?: { immediate?: boolean }): void; stop(): void; start(): void };
let lenis: Scroller | null = null;
export const registerScroller = (s: Scroller | null) => {
  lenis = s;
};

// In pinned mode the story stages are progress points inside one tall section, marked by [data-anchor].
export function resolveAnchor(id: string): HTMLElement | null {
  if (isPinned()) {
    const marker = document.querySelector<HTMLElement>(`[data-anchor="${CSS.escape(id)}"]`);
    if (marker) return marker;
  }
  return document.getElementById(id);
}

// Moves keyboard focus to an in-page target after navigation (WCAG 2.4.3). Pinned markers hand off to the
// element with the real id, which may not be focusable by itself.
export function focusTarget(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
}

export function scrollToElement(el: HTMLElement, immediate = false) {
  const offset = isPinned() && el.hasAttribute('data-anchor') ? 0 : 88;
  const y = el.getBoundingClientRect().top + window.scrollY - offset;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (lenis && !immediate) lenis.scrollTo(y);
  else window.scrollTo({ top: y, behavior: immediate || reduce ? 'auto' : 'smooth' });
}

// Freezes page scrolling while a modal panel is open. CSS keeps the scrollbar gutter, so nothing shifts.
export function setScrollLock(on: boolean) {
  document.documentElement.toggleAttribute('data-scroll-lock', on);
  if (on) lenis?.stop();
  else lenis?.start();
}