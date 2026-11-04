import { useEffect, useState, type ReactNode } from 'react';

const TYPE_MS = 45;
const ERASE_MS = 22;
const HOLD_MS = 2200;
const GAP_MS = 350;

type Props = { items: string[]; play: boolean; className?: string; suffix?: ReactNode; onItem?: (item: string) => void };

// Types each item, holds it, erases it, then the next; a caret blinks after the text and suffix follows it.
// Decorative (aria-hidden): the caller names the control. Paused or reduced motion: the first item, typed.
export default function TypeLoop({ items, play, className = '', suffix, onItem }: Props) {
  const [index, setIndex] = useState(0);
  const [length, setLength] = useState(items[0]?.length ?? 0);
  const [erasing, setErasing] = useState(false);

  useEffect(() => {
    if (!play || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const item = items[index % items.length];
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
  }, [play, items, index, length, erasing]);

  // Tells the caller which item is on screen (the agent's Tab-to-accept).
  const current = items[index % items.length];
  useEffect(() => onItem?.(current), [current, onItem]);

  // The longest item (plus suffix), invisible in the same grid cell, keeps the box fixed while the text types.
  const longest = items.reduce((a, b) => (b.length > a.length ? b : a), '');
  return (
    <span aria-hidden="true" className={`inline-grid ${className}`}>
      <span className="invisible [grid-area:1/1]">
        {longest}
        <span className="type-caret" />
        {suffix}
      </span>
      <span className="[grid-area:1/1]">
        {items[index % items.length].slice(0, length)}
        <span className="type-caret" />
        {suffix}
      </span>
    </span>
  );
}
