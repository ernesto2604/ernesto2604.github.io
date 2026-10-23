import { useEffect } from 'react';

// Lenis only for fine pointers without reduced motion; touch devices keep native scrolling.
export default function SmoothScroll() {
  useEffect(() => {
    if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let lenis: { destroy(): void } | undefined;
    let cancelled = false;
    import('lenis').then(({ default: Lenis }) => {
      if (cancelled) return;
      lenis = new Lenis({ autoRaf: true, anchors: { offset: -88 }, lerp: 0.12 });
    });
    return () => {
      cancelled = true;
      lenis?.destroy();
    };
  }, []);
  return null;
}
