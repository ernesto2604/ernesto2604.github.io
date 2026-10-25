// Shared scrolling helpers: pinned-story mode, anchor resolution and smooth scrolling.

// Must match the media query in public/boot.js, which sets html[data-pinned] before first paint.
export const PINNED_QUERY = '(min-width: 1024px) and (min-height: 740px) and (prefers-reduced-motion: no-preference)';

export const isPinned = () => document.documentElement.hasAttribute('data-pinned');

type Scroller = {
  scrollTo(target: number, opts?: { immediate?: boolean; force?: boolean; onComplete?: () => void }): void;
  stop(): void;
  start(): void;
};
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
  // Pinned story points and section seams are whole screens: land on them exactly, never just short of a seam
  // (that would leave the previous section on screen and the next one waiting to swap in).
  const offset = isPinned() && (el.hasAttribute('data-anchor') || el.hasAttribute('data-seam')) ? 0 : 88;
  scrollToY(el.getBoundingClientRect().top + window.scrollY - offset, immediate);
}

// While a link or the agent scrolls the page, crossing a seam must not trigger a section swap.
let guided = 0;

export function scrollToY(y: number, immediate = false) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (immediate || reduce) {
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo({ top: y, behavior: 'auto' });
    return;
  }
  guided = performance.now() + 2000;
  if (lenis) lenis.scrollTo(y, { onComplete: () => (guided = 0) });
  else window.scrollTo({ top: y, behavior: 'smooth' });
}

// Section seams ([data-seam]): crossing one never scrolls the next section into view. The page fades out,
// jumps so the next section sits at the top (going up: the previous one ends at the bottom) and fades back in,
// the same in-place change as the hero handing over to Retrieval. Pinned (desktop) mode only.
const SWAP_MS = 220;
let swapping = false;

export function swapAtSeam(down: boolean) {
  if (swapping || !isPinned() || performance.now() < guided) return;
  const vh = innerHeight;
  for (const el of document.querySelectorAll<HTMLElement>('[data-seam]')) {
    const top = el.getBoundingClientRect().top;
    if (top <= 1 || top >= vh - 1) continue;
    const y = window.scrollY + (down ? top : top - vh);
    const html = document.documentElement;
    swapping = true;
    lenis?.stop();
    html.setAttribute('data-swap', '');
    window.setTimeout(() => {
      lenis?.start();
      scrollToY(y, true);
      requestAnimationFrame(() => html.removeAttribute('data-swap'));
      window.setTimeout(() => (swapping = false), SWAP_MS + 120);
    }, SWAP_MS);
    return;
  }
}

// Freezes page scrolling while a modal panel is open. The page is padded by the scrollbar it hides, so nothing shifts.
export function setScrollLock(on: boolean) {
  const html = document.documentElement;
  if (on) html.style.setProperty('--scrollbar-w', `${innerWidth - html.clientWidth}px`);
  html.toggleAttribute('data-scroll-lock', on);
  if (on) lenis?.stop();
  else lenis?.start();
}