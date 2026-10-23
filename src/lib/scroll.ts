// Shared scrolling helpers: pinned-story mode, anchor resolution and smooth scrolling.

// Must match the media query in public/boot.js, which sets html[data-pinned] before first paint.
export const PINNED_QUERY = '(min-width: 1024px) and (min-height: 740px) and (prefers-reduced-motion: no-preference)';

export const isPinned = () => document.documentElement.hasAttribute('data-pinned');

type Scroller = { scrollTo(target: number, opts?: { immediate?: boolean }): void };
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

export function scrollToElement(el: HTMLElement, immediate = false) {
  const offset = isPinned() && el.hasAttribute('data-anchor') ? 0 : 88;
  const y = el.getBoundingClientRect().top + window.scrollY - offset;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (lenis && !immediate) lenis.scrollTo(y);
  else window.scrollTo({ top: y, behavior: immediate || reduce ? 'auto' : 'smooth' });
}
