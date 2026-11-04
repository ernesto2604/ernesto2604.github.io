import { useCallback, useEffect, useRef } from 'react';

// Adapted from the shadcn "morphing-text" component: the threshold filter melts one text into the next.
// Changes: no cn/tailwind-merge (not in this project), sizing comes from the caller, it holds texts[0]
// first, pauses when `play` is false, and the box is sized by the texts themselves in normal flow.

type MorphingTextProps = {
  texts: string[];
  className?: string;
  play?: boolean;
  morphTime?: number; // seconds of melting between two texts
  cooldownTime?: number; // seconds each text holds still
};

const useMorphingText = (texts: string[], play: boolean, morphTime: number, cooldownTime: number) => {
  // texts[0] holds for a full cooldown first, then melts into texts[1].
  const textIndexRef = useRef(0);
  const morphRef = useRef(0);
  const cooldownRef = useRef(cooldownTime);
  const timeRef = useRef(0);

  const text1Ref = useRef<HTMLSpanElement>(null);
  const text2Ref = useRef<HTMLSpanElement>(null);

  const setStyles = useCallback(
    (fraction: number) => {
      const [current1, current2] = [text1Ref.current, text2Ref.current];
      if (!current1 || !current2) return;

      current2.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
      current2.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;

      const invertedFraction = 1 - fraction;
      current1.style.filter = `blur(${Math.min(8 / invertedFraction - 8, 100)}px)`;
      current1.style.opacity = `${Math.pow(invertedFraction, 0.4) * 100}%`;

      current1.textContent = texts[textIndexRef.current % texts.length];
      current2.textContent = texts[(textIndexRef.current + 1) % texts.length];
    },
    [texts],
  );

  const doMorph = useCallback(() => {
    morphRef.current -= cooldownRef.current;
    cooldownRef.current = 0;

    let fraction = morphRef.current / morphTime;

    if (fraction > 1) {
      cooldownRef.current = cooldownTime;
      fraction = 1;
    }

    setStyles(fraction);

    if (fraction === 1) {
      textIndexRef.current++;
    }
  }, [setStyles, morphTime, cooldownTime]);

  const doCooldown = useCallback(() => {
    morphRef.current = 0;
    const [current1, current2] = [text1Ref.current, text2Ref.current];
    if (current1 && current2) {
      current2.style.filter = 'none';
      current2.style.opacity = '100%';
      current1.style.filter = 'none';
      current1.style.opacity = '0%';
    }
  }, []);

  useEffect(() => {
    if (!play) return;
    let animationFrameId: number;
    timeRef.current = performance.now(); // a pause must not count as elapsed time

    const animate = (now: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const dt = (now - timeRef.current) / 1000;
      timeRef.current = now;

      cooldownRef.current -= dt;

      if (cooldownRef.current <= 0) doMorph();
      else doCooldown();
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [play, doMorph, doCooldown]);

  return { text1Ref, text2Ref };
};

const SvgFilters = () => (
  <svg className="hidden" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <filter id="morph-threshold">
        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values="1 0 0 0 0
                  0 1 0 0 0
                  0 0 1 0 0
                  0 0 0 255 -140"
        />
      </filter>
    </defs>
  </svg>
);

// Decorative: the caller gives the accessible text (e.g. an sr-only copy in the heading).
export default function MorphingText({ texts, className = '', play = true, morphTime = 1.5, cooldownTime = 0.5 }: MorphingTextProps) {
  const { text1Ref, text2Ref } = useMorphingText(texts, play, morphTime, cooldownTime);
  return (
    <span aria-hidden="true" className={`relative grid [filter:url(#morph-threshold)_blur(0.6px)] ${className}`}>
      {/* Invisible copies in one grid cell: the box is as tall as the longest text at any width. */}
      {texts.map((text) => (
        <span key={text} className="invisible [grid-area:1/1]">
          {text}
        </span>
      ))}
      <span className="absolute inset-x-0 top-0 block w-full opacity-0" ref={text1Ref} />
      <span className="absolute inset-x-0 top-0 block w-full" ref={text2Ref}>
        {texts[0]}
      </span>
      <SvgFilters />
    </span>
  );
}
