import { useEffect } from 'react';
import { focusTarget, registerScroller, resolveAnchor, scrollToElement, swapAtSeam } from '../lib/scroll';

// In-page links go through resolveAnchor so story stages land on their scroll progress point.
// Lenis smooths wheel scrolling on fine pointers only; touch keeps native scrolling.
export default function SmoothScroll() {
  useEffect(() => {
    document.documentElement.setAttribute('data-hydrated', '');

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as Element).closest?.('a[href^="#"]');
      const id = a?.getAttribute('href')!.slice(1);
      const target = id ? resolveAnchor(id) : null;
      if (!target) return;
      e.preventDefault();
      history.pushState(null, '', `#${id}`);
      scrollToElement(target);
      focusTarget(id!);
    };
    document.addEventListener('click', onClick);

    // Swap sections in place as soon as a seam comes into view (see swapAtSeam).
    let lastY = scrollY;
    const onScroll = () => {
      if (scrollY !== lastY) swapAtSeam(scrollY > lastY);
      lastY = scrollY;
    };
    addEventListener('scroll', onScroll, { passive: true });

    if (location.hash) {
      const target = resolveAnchor(location.hash.slice(1));
      if (target) requestAnimationFrame(() => scrollToElement(target, true));
    }

    let lenis: { destroy(): void } | undefined;
    let cancelled = false;
    if (matchMedia('(pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      import('lenis').then(({ default: Lenis }) => {
        if (cancelled) return;
        const instance = new Lenis({ autoRaf: true, lerp: 0.12 });
        registerScroller(instance);
        lenis = instance;
      });
    }
    return () => {
      cancelled = true;
      document.removeEventListener('click', onClick);
      removeEventListener('scroll', onScroll);
      registerScroller(null);
      lenis?.destroy();
    };
  }, []);
  return null;
}
