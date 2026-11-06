import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export type StackItem = { id: string; num: string; name: string; sublabel?: string; image: string };

// Each item gets one of these masks, in order; the photo grows in through it, breathes, then shrinks out, on a loop.
const CLIPS = ['stack-clip-columns', 'stack-clip-tiles', 'stack-clip-grid'];

// A numbered list beside a masked photo: hovering or focusing a name shows its photo, clicking it calls onSelect.
// Reduced motion: the photo rests fully shown. The loop only runs while the photo is on screen and `paused` is off.
// `openLabel` is the verb screen readers hear before the name ("Open"), so each button is named "Open <name>".
export default function StackInteractor({ items, onSelect, openLabel, paused = false }: { items: StackItem[]; onSelect: (index: number) => void; openLabel: string; paused?: boolean }) {
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const clipId = CLIPS[active % CLIPS.length];
  const running = inView && !paused;
  const runningRef = useRef(running);
  runningRef.current = running;

  // Near the viewport: fetch and decode every photo once, so hovering swaps without a decode mid-animation.
  // On screen: let the loop run.
  useEffect(() => {
    const svg = svgRef.current!;
    const preload = () => {
      for (const { image } of items) {
        const img = new Image();
        img.src = image;
        img.decode().catch(() => {});
      }
    };
    // After load, so the photos never compete with the page's own scripts and fonts.
    const near = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      near.disconnect();
      if (document.readyState === 'complete') preload();
      else addEventListener('load', preload, { once: true });
    }, { rootMargin: '100% 0px' });
    const seen = new IntersectionObserver(([e]) => setInView(e.isIntersecting));
    near.observe(svg);
    seen.observe(svg);
    return () => {
      removeEventListener('load', preload);
      near.disconnect();
      seen.disconnect();
    };
  }, [items]);

  useEffect(() => {
    if (running) tlRef.current?.play();
    else tlRef.current?.pause();
  }, [running]);

  useLayoutEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      const paths = `#${clipId} .path`;
      gsap.set(paths, { scale: 0, transformOrigin: '50% 50%' });
      tlRef.current = gsap
        .timeline({ repeat: -1, repeatDelay: 1, paused: !runningRef.current })
        .to(paths, { scale: 1, duration: 0.8, stagger: { amount: 0.4, from: 'random' }, ease: 'expo.out' })
        .to(paths, { scale: 1.05, duration: 1.5, yoyo: true, repeat: 1, ease: 'sine.inOut', stagger: { amount: 0.2, from: 'center' } })
        .to(paths, { scale: 0, duration: 0.6, stagger: { amount: 0.3, from: 'edges' }, ease: 'expo.in' });
    }, svgRef);
    return () => {
      ctx.revert();
      tlRef.current = null;
    };
  }, [clipId]);

  return (
    <div className="flex w-full flex-col items-center justify-between gap-16 lg:flex-row">
      <ul className="flex w-full flex-col gap-12 lg:w-1/2">
        {items.map((item, i) => {
          const on = i === active;
          return (
            <li key={item.id} id={item.id} className="scroll-mt-48">
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => onSelect(i)}
                className="flex cursor-pointer items-start gap-6 text-left"
              >
                {/* The negative number stays put; the amber copy over it only fades, since an amber in mid-transition
                    under the difference blend flashes blue. Each scales itself: a transform on a shared parent would
                    isolate the blend. Named by its content: the sr-only verb plus the visible name; the number and
                    the stack line are decorative (aria-hidden), so the name contains the label you see (WCAG 2.5.3). */}
                <span className="sr-only">{openLabel} </span>
                <span aria-hidden="true" className="relative mt-1 font-mono text-xl">
                  <span className={`ink-auto ink-muted inline-block transition-transform duration-500 ${on ? 'scale-110' : ''}`}>{item.num}</span>
                  <span aria-hidden="true" className={`absolute inset-0 text-accent transition-[opacity,scale] duration-500 ${on ? 'scale-110 opacity-100' : 'opacity-0'}`}>{item.num}</span>
                </span>
                {/* Negative of whatever is behind (ink on paper, light on the fog), so it reads at every point of the
                    light-to-dark scroll; the amber number stays out of it. */}
                <span className={`ink-auto block transition-transform duration-700 ${on ? 'translate-x-4' : ''}`}>
                  <span data-on={on || undefined} className="ink-name block max-w-[12ch] text-3xl leading-[0.9] font-[var(--font-weight-display)] tracking-[var(--tracking-display)] uppercase">
                    {item.name}
                  </span>
                  {item.sublabel && <span aria-hidden="true" className="ink-muted mt-3 block font-mono text-xs tracking-wider uppercase">{item.sublabel}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <svg ref={svgRef} viewBox="0 0 500 500" aria-hidden="true" className="h-auto w-full max-w-[500px] lg:w-1/2">
        <defs>
          <clipPath id="stack-clip-columns">
            <rect className="path" x="20" y="20" width="100" height="180" rx="12" />
            <rect className="path" x="20" y="220" width="100" height="260" rx="12" />
            <rect className="path" x="140" y="20" width="100" height="280" rx="12" />
            <rect className="path" x="140" y="320" width="100" height="160" rx="12" />
            <rect className="path" x="260" y="20" width="100" height="120" rx="12" />
            <rect className="path" x="260" y="160" width="100" height="320" rx="12" />
            <rect className="path" x="380" y="20" width="100" height="220" rx="12" />
            <rect className="path" x="380" y="260" width="100" height="220" rx="12" />
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
