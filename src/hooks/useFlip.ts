import { useLayoutEffect, useRef, type RefObject } from 'react';

// FLIP: children with [data-flip] glide from their previous offset to the new one after a re-render.
export function useFlip(listRef: RefObject<HTMLElement | null>, key: unknown, durationMs = 640) {
  const prev = useRef(new Map<string, number>());
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const items = [...list.querySelectorAll<HTMLElement>('[data-flip]')];
    for (const el of items) {
      const id = el.dataset.flip!;
      const before = prev.current.get(id);
      const now = el.offsetTop;
      prev.current.set(id, now);
      if (before === undefined || before === now || reduce) continue;
      el.style.transition = 'none';
      el.style.transform = `translateY(${before - now}px)`;
      void el.offsetHeight;
      el.style.transition = `transform ${durationMs}ms var(--ease-out)`;
      el.style.transform = '';
    }
  }, [listRef, key, durationMs]);
}
