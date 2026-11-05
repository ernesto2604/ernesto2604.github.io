import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react';

const TYPE_MS = 45;
const ERASE_MS = 22;
const HOLD_MS = 2200;
const GAP_MS = 350;

type Props = { items: string[]; play: boolean; className?: string; suffix?: ReactNode; onItem?: (item: string) => void; fit?: boolean; once?: boolean; tail?: string };

// Types each item, holds it, erases it, then the next; a caret blinks after the text and suffix follows it.
// With `once` it types the first item in from empty when `play` turns on, then `tail` (in a .type-tail span, after a
// gap), then rests without a caret.
// Decorative (aria-hidden): the caller names the control. Paused or reduced motion: the first item, typed.
export default function TypeLoop({ items, play, className = '', suffix, onItem, fit = false, once = false, tail = '' }: Props) {
  const [index, setIndex] = useState(0);
  const full = (items[0]?.length ?? 0) + (once ? tail.length : 0);
  const [length, setLength] = useState(full);
  const [erasing, setErasing] = useState(false);
  const [started, setStarted] = useState(false);
  const typing = once && length < full;

  // `once` text stays hidden (CSS, html.js only) until it starts typing, so the finished server text never shows
  // first. Reduced motion shows it typed straight away.
  // The tail can resolve after mount (⌘K on a Mac), so the typed-straight-away length follows it.
  useLayoutEffect(() => {
    if (!once || !matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setLength(full);
    setStarted(true);
  }, [once, full]);
  useLayoutEffect(() => {
    if (!once || !play || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setLength(0);
    setStarted(true);
  }, [once, play]);

  useEffect(() => {
    if (!play || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const item = items[index % items.length];
    if (once) {
      if (length >= full) return;
      const timer = setTimeout(() => setLength((n) => n + 1), TYPE_MS);
      return () => clearTimeout(timer);
    }
    let delay = erasing ? ERASE_MS : TYPE_MS;
    let next = () => setLength((n) => n + (erasing ? -1 : 1));
    if (!erasing && length >= item.length) [delay, next] = [HOLD_MS, () => setErasing(true)];
    else if (erasing && length <= 0)
      [delay, next] = [
        GAP_MS,
        () => {
          setErasing(false);
          setIndex((i) => i + 1);
        },
      ];
    const timer = setTimeout(next, delay);
    return () => clearTimeout(timer);
  }, [play, items, index, length, erasing, once, full]);

  // Tells the caller which item is on screen (the agent's Tab-to-accept).
  const current = items[index % items.length];
  useEffect(() => onItem?.(current), [current, onItem]);

  // The longest item (plus suffix), invisible in the same grid cell, keeps the box fixed while the text types.
  // With `fit` only its height is kept: the box follows the text, so a centred line stays centred.
  const longest = items.reduce((a, b) => (b.length > a.length ? b : a), '');
  return (
    <span aria-hidden="true" data-type-once={once || undefined} data-started={started || undefined} data-typing={typing || undefined} className={`inline-grid ${className}`}>
      <span className={`invisible [grid-area:1/1] ${fit ? 'w-0 overflow-hidden' : ''}`}>
        {longest}
        {once && tail && <span className="type-tail">{tail}</span>}
        <span className="type-caret" />
        {suffix}
      </span>
      <span className="[grid-area:1/1]">
        {items[index % items.length].slice(0, length)}
        {once && length > (items[0]?.length ?? 0) && <span className="type-tail">{tail.slice(0, length - items[0].length)}</span>}
        {(!once || typing) && <span className="type-caret" />}
        {suffix}
      </span>
    </span>
  );
}
