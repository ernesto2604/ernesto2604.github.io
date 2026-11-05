import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export type StackItem = { id: string; num: string; name: string; sublabel?: string; image: string; ariaLabel: string };

// Each item gets one of these masks, in order; the photo grows in through it, breathes, then shrinks out, on a loop.
const CLIPS = ['stack-clip-bands', 'stack-clip-tiles', 'stack-clip-grid'];

// A numbered list beside a masked photo: hovering or focusing a name shows its photo, clicking it calls onSelect.
// Reduced motion: the photo rests fully shown.
export default function StackInteractor({ items, onSelect }: { items: StackItem[]; onSelect: (index: number) => void }) {
  const [active, setActive] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const clipId = CLIPS[active % CLIPS.length];

  useLayoutEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      const paths = `#${clipId} .path`;
      gsap.set(paths, { scale: 0, transformOrigin: '50% 50%' });
      gsap
        .timeline({ repeat: -1, repeatDelay: 1 })
        .to(paths, { scale: 1, duration: 0.8, stagger: { amount: 0.4, from: 'random' }, ease: 'expo.out' })
        .to(paths, { scale: 1.05, duration: 1.5, yoyo: true, repeat: 1, ease: 'sine.inOut', stagger: { amount: 0.2, from: 'center' } })
        .to(paths, { scale: 0, duration: 0.6, stagger: { amount: 0.3, from: 'edges' }, ease: 'expo.in' });
    }, svgRef);
    return () => ctx.revert();
  }, [clipId]);

  return (
    <div className="flex w-full flex-col items-center justify-between gap-16 lg:flex-row">
      <ul className="z-10 flex w-full flex-col gap-12 lg:w-1/2">
        {items.map((item, i) => {
          const on = i === active;
          return (
            <li key={item.id} id={item.id} className="scroll-mt-48">
              <button
                type="button"
                aria-label={item.ariaLabel}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => onSelect(i)}
                className="flex cursor-pointer items-start gap-6 text-left"
              >
                <span className={`mt-1 font-mono text-xl transition-all duration-500 ${on ? 'scale-110 text-accent' : 'text-muted'}`}>{item.num}</span>
                <span className={`block transition-all duration-700 ${on ? 'translate-x-4 text-text' : 'text-muted'}`}>
                  <span className={`block max-w-[12ch] text-3xl [paint-order:stroke_fill] transition-colors duration-700 ${on ? "[-webkit-text-stroke:2px_var(--text)]" : "text-[var(--bg-0)] [-webkit-text-stroke:2px_var(--text-muted)]"} leading-[0.9] font-[var(--font-weight-display)] tracking-[var(--tracking-display)] uppercase`}>
                    {item.name}
                  </span>
                  {item.sublabel && <span className="mt-3 block font-mono text-xs tracking-wider uppercase">{item.sublabel}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <svg ref={svgRef} viewBox="0 0 500 500" aria-hidden="true" className="h-auto w-full max-w-[500px] lg:w-1/2">
        <defs>
          <clipPath id="stack-clip-bands">
            <path className="path" d="M480.6,235H19.4c-6,0-10.8-4.9-10.8-10.8v-9.5c0-6,4.9-10.8,10.8-10.8h461.1c6,0,10.8,4.9,10.8,10.8v9.5C491.4,230.2,486.6,235,480.6,235z" />
            <path className="path" d="M483.1,362.4H16.9c-4.6,0-8.3-3.7-8.3-8.3v-1.8c0-4.6,3.7-8.3,8.3-8.3h466.1c4.6,0,8.3,3.7,8.3,8.3v1.8C491.4,358.7,487.7,362.4,483.1,362.4z" />
            <path className="path" d="M460.3,336.3H39.7c-17.2,0-31.1-13.9-31.1-31.1v-31.5c0-17.2,13.9-31.1,31.1-31.1h420.7c17.2,0,31.1,13.9,31.1,31.1v31.5C491.4,322.4,477.5,336.3,460.3,336.3z" />
            <path className="path" d="M459.2,196.2H40.8v-35c0-47.5,38.5-86,86-86h246.5c47.5,0,86,38.5,86,86V196.2z" />
            <path className="path" d="M441.9,424.9H58.1c-9.6,0-17.3-7.8-17.3-17.3v-37.4h418.5v37.4C459.2,417.1,451.5,424.9,441.9,424.9z" />
          </clipPath>
          <clipPath id="stack-clip-tiles">
            <rect className="path" x="20" y="20" width="200" height="280" rx="12" />
            <rect className="path" x="20" y="320" width="200" height="160" rx="12" />
            <rect className="path" x="240" y="20" width="240" height="140" rx="12" />
            <rect className="path" x="240" y="180" width="110" height="160" rx="12" />
            <rect className="path" x="370" y="180" width="110" height="160" rx="12" />
            <rect className="path" x="240" y="360" width="240" height="120" rx="12" />
          </clipPath>
          <clipPath id="stack-clip-grid">
            {Array.from({ length: 9 }, (_, i) => (
              <rect key={i} className="path" x={(i % 3) * 160 + 20} y={Math.floor(i / 3) * 160 + 20} width="140" height="140" rx="4" />
            ))}
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <image href={items[active].image} width="500" height="500" preserveAspectRatio="xMidYMid slice" />
        </g>
      </svg>
    </div>
  );
}
