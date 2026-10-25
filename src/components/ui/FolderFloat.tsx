// From React Bits (FolderFloat-TS-TW, via the shadcn registry @react-bits), adapted: the matter-js physics
// (dragging the notes around) is removed, so the notes only spring out and drift; the folder itself takes an
// onActivate callback (it opens something) instead of toggling, and the notes are display-only.
import React, { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';

export interface FolderFloatProps {
  items?: string[];
  label?: string;
  sublabel?: string;
  onActivate?: () => void;
  ariaLabel?: string;
  folderColor?: string;
  frontColor?: string;
  paperColor?: string;
  itemColor?: string;
  itemTextColor?: string;
  labelColor?: string;
  width?: number;
  height?: number;
  radius?: number;
  spread?: number;
  lift?: number;
  tilt?: number;
  flapAngle?: number;
  restAngle?: number;
  openDuration?: number;
  stagger?: number;
  bounce?: number;
  className?: string;
}

type Size = { w: number; h: number };

const PAD = 28;
const CHAR = 6.8;
const GAP = 12;
const ROW = 52;

const jitter = (i: number) => {
  const x = Math.sin(i * 12.9898 + 4.1414) * 43758.5453;
  return x - Math.floor(x);
};

const layout = (list: string[], spread: number, lift: number, tilt: number, sizes: (Size | null)[]) => {
  const rows: { items: { i: number; pw: number }[]; width: number }[] = [];
  let row: { i: number; pw: number }[] = [];
  let width = 0;
  list.forEach((item, i) => {
    const pw = sizes[i]?.w ?? PAD + item.length * CHAR;
    if (row.length && width + GAP + pw > spread * 2) {
      rows.push({ items: row, width });
      row = [];
      width = 0;
    }
    row.push({ i, pw });
    width += (row.length > 1 ? GAP : 0) + pw;
  });
  if (row.length) rows.push({ items: row, width });
  const pos: { x: number; y: number; r: number }[] = [];
  rows.forEach((r, ri) => {
    let x = -r.width / 2;
    const shift = (ri % 2 ? 1 : -1) * Math.min(16, spread * 0.1);
    r.items.forEach(({ i, pw }) => {
      const j = jitter(i);
      pos[i] = { x: x + pw / 2 + shift + (j - 0.5) * 6, y: -lift - ri * ROW - j * 6, r: tilt * (j * 2 - 1) };
      x += pw + GAP;
    });
  });
  return pos;
};

const STYLE = `
@keyframes folder-float-drift { 0%, 100% { translate: 0 0; } 50% { translate: 0 -3px; } }
`;

const FolderFloat: React.FC<FolderFloatProps> = ({
  items = [],
  label = '',
  sublabel = '',
  onActivate,
  ariaLabel,
  folderColor = '#3f3f46',
  frontColor = '#52525b',
  paperColor = '#f5f5f5',
  itemColor = '#f5f5f5',
  itemTextColor = '#18181b',
  labelColor = '#f5f5f5',
  width = 200,
  height = 148,
  radius = 14,
  spread = 180,
  lift = 26,
  tilt = 8,
  flapAngle = 34,
  restAngle = 16,
  openDuration = 520,
  stagger = 45,
  bounce = 0.3,
  className = ''
}) => {
  const [open, setOpen] = useState(false);
  const [sizes, setSizes] = useState<Size[]>([]);
  const pillRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const n = items.length;
  const pos = layout(items, spread, lift, tilt, sizes);

  const labelsKey = items.join('|');
  useLayoutEffect(() => {
    const measure = () => {
      const next = pillRefs.current.slice(0, n).map(el => (el ? { w: el.offsetWidth, h: el.offsetHeight } : null));
      if (next.some(s => !s)) return;
      const sized = next as Size[];
      setSizes(prev =>
        prev.length === sized.length && prev.every((s, i) => s.w === sized[i].w && s.h === sized[i].h) ? prev : sized
      );
    };
    measure();
    document.fonts?.ready.then(measure);
  }, [n, labelsKey]);

  return (
    <div
      className={`group relative inline-block text-[13px] leading-none font-medium [width:var(--ff-w)] [padding-top:var(--ff-tab)] [font-family:inherit]${className ? ` ${className}` : ''}`}
      data-open={open ? '' : undefined}
      onPointerEnter={e => e.pointerType === 'mouse' && setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      style={
        {
          '--ff-w': `${width}px`,
          '--ff-h': `${height}px`,
          '--ff-r': `${radius}px`,
          '--ff-back': folderColor,
          '--ff-front': frontColor,
          '--ff-paper': paperColor,
          '--ff-item': itemColor,
          '--ff-item-ink': itemTextColor,
          '--ff-label': labelColor,
          '--ff-spread': `${spread}px`,
          '--ff-lift': `${lift}px`,
          '--ff-angle': `${flapAngle}deg`,
          '--ff-rest': `${restAngle}deg`,
          '--ff-open': `${openDuration}ms`,
          '--ff-close': `${Math.round(openDuration * 0.6)}ms`,
          '--ff-stagger': `${stagger}ms`,
          '--ff-n': n,
          '--ff-tab': '14px',
          '--ff-ease-out': 'cubic-bezier(0.23, 1, 0.32, 1)',
          '--ff-spring': `cubic-bezier(0.34, ${(1 + bounce * 1.9).toFixed(2)}, 0.64, 1)`
        } as CSSProperties
      }
    >
      <style>{STYLE}</style>
      <div className="pointer-events-none absolute top-[var(--ff-tab)] left-1/2 z-[1] h-0 w-0" aria-hidden="true">
        {items.map((item, i) => {
          const p = pos[i];
          return (
            <span
              key={`${item}-${i}`}
              ref={el => {
                pillRefs.current[i] = el;
              }}
              className="absolute top-0 left-1/2 m-0 flex h-[34px] items-center rounded-[17px] px-3.5 whitespace-nowrap opacity-0 shadow-[0_4px_12px_rgba(0,0,0,0.14)] [background:var(--ff-item)] [color:var(--ff-item-ink)] [transform:translate(-50%,44px)_scale(0.6)] [transform-origin:50%_50%] [transition:transform_var(--ff-close)_var(--ff-ease-out)_calc((var(--ff-n)-1-var(--i))*var(--ff-stagger)*0.5),opacity_160ms_ease_calc((var(--ff-n)-1-var(--i))*var(--ff-stagger)*0.5+var(--ff-close)*0.45)] group-data-[open]:opacity-100 group-data-[open]:[transform:translate(calc(-50%+var(--x)),var(--y))_rotate(var(--r))_scale(1)] group-data-[open]:[transition:transform_var(--ff-open)_var(--ff-spring)_calc(var(--i)*var(--ff-stagger)),opacity_160ms_ease_calc(var(--i)*var(--ff-stagger))] motion-reduce:[transition:opacity_200ms_ease] motion-reduce:group-data-[open]:[transition:opacity_200ms_ease_calc(var(--i)*var(--ff-stagger))]"
              style={
                {
                  '--i': i,
                  '--x': `${p.x.toFixed(1)}px`,
                  '--y': `${p.y.toFixed(1)}px`,
                  '--r': `${p.r.toFixed(2)}deg`
                } as CSSProperties
              }
            >
              <span className="block [animation:folder-float-drift_3.2s_ease-in-out_infinite] [animation-delay:calc(var(--i)*-0.7s)] [animation-play-state:paused] group-data-[open]:[animation-play-state:running] motion-reduce:[animation:none]">
                {item}
              </span>
            </span>
          );
        })}
      </div>
      <div className="relative [width:var(--ff-w)] [height:var(--ff-h)]">
        <span
          className="absolute inset-0 z-0 [border-radius:var(--ff-r)] [background:var(--ff-back)] [transform:perspective(600px)_rotateX(8deg)] [transform-origin:50%_100%] before:absolute before:top-[calc(-1*var(--ff-tab))] before:left-0 before:h-[calc(var(--ff-tab)+var(--ff-r))] before:w-[42%] before:[border-radius:var(--ff-r)_var(--ff-r)_0_0] before:[background:inherit] before:content-['']"
          aria-hidden="true"
        />
        <span
          className="absolute top-[10%] right-[8%] left-[8%] z-[1] h-1/2 rounded-md opacity-0 [background:var(--ff-paper)] [transform:translateY(10px)] [transition:transform_var(--ff-close)_var(--ff-ease-out),opacity_var(--ff-close)_ease] group-data-[open]:opacity-100 group-data-[open]:[transform:translateY(0)] group-data-[open]:[transition:transform_var(--ff-open)_var(--ff-ease-out),opacity_200ms_ease] motion-reduce:[transform:none]! motion-reduce:[transition:opacity_200ms_ease]"
          aria-hidden="true"
        />
        <span
          className="absolute right-0 bottom-0 left-0 z-[2] box-border flex h-[76%] flex-col justify-end gap-[5px] px-4 py-3.5 [border-radius:var(--ff-r)] [background:linear-gradient(180deg,color-mix(in_srgb,var(--ff-front)_92%,#fff),var(--ff-front)_60%)] [color:var(--ff-label)] shadow-[0_-10px_24px_rgba(0,0,0,0.28)] [transform:perspective(600px)_rotateX(calc(-1*var(--ff-rest)))] [transform-origin:50%_100%] [transition:transform_var(--ff-open)_var(--ff-ease-out)] group-data-[open]:[transform:perspective(600px)_rotateX(calc(-1*var(--ff-angle)))] motion-reduce:group-data-[open]:[transform:perspective(600px)_rotateX(calc(-1*var(--ff-rest)))] motion-reduce:[transition:opacity_200ms_ease]"
          aria-hidden="true"
        >
          <span className="text-[15px] font-semibold">{label}</span>
          {sublabel && <span className="text-[12px] opacity-70">{sublabel}</span>}
        </span>
        <button
          type="button"
          className="absolute right-0 bottom-0 left-0 z-[3] m-0 h-[76%] cursor-pointer border-0 bg-transparent p-0 [border-radius:var(--ff-r)] [-webkit-tap-highlight-color:transparent]"
          aria-label={ariaLabel ?? label}
          onClick={onActivate}
        />
      </div>
    </div>
  );
};

export default FolderFloat;
