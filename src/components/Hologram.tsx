import { useEffect, useRef, useState } from 'react';
import { useT } from '../i18n';
import type { HologramHandle } from '../lib/hologram';

const MODEL_URL = '/models/ernesto.glb';

type Status = 'idle' | 'loading' | 'ready' | 'error';

// Dark panel with the 3D hologram. three.js and the model load only when the panel is within
// ~1 screen of the viewport. It renders only while on screen and `active` (the pinned hero fades
// out without leaving the viewport), and materializes once the welcome loader has finished.
export default function Hologram({ className = '', active = true }: { className?: string; active?: boolean }) {
  const t = useT();
  const panelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<HologramHandle | null>(null);
  const activeRef = useRef(active);
  const syncRef = useRef(() => {});
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    const panel = panelRef.current!;
    const html = document.documentElement;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lite = matchMedia('(max-width: 767px), (pointer: coarse)').matches || (navigator.hardwareConcurrency ?? 8) <= 4;
    let disposed = false;
    let inView = false;
    let near = false;
    let started = false;

    const sync = () => {
      const h = handleRef.current;
      if (!h) return;
      const on = inView && activeRef.current;
      h.setVisible(on);
      if (on && !html.hasAttribute('data-welcome')) h.reveal();
    };
    syncRef.current = sync;

    const load = async () => {
      setStatus('loading');
      try {
        const { createHologram } = await import('../lib/hologram');
        const h = await createHologram(canvasRef.current!, MODEL_URL, { reducedMotion, lite });
        if (disposed) return h.dispose();
        handleRef.current = h;
        setStatus('ready');
        sync();
      } catch (err) {
        console.warn('hologram unavailable', err);
        if (!disposed) setStatus('error');
      }
    };

    // Loading three.js and decoding the model would stall the welcome loader's timers, so it waits for it.
    const maybeLoad = () => {
      if (started || !near || html.hasAttribute('data-welcome')) return;
      started = true;
      void load();
    };
    const nearObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        nearObserver.disconnect();
        near = true;
        maybeLoad();
      },
      { rootMargin: '100% 0px' },
    );
    const seen = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        sync();
      },
      { threshold: 0.35 },
    );
    // public/welcome.js removes html[data-welcome] when the loader ends.
    const welcome = new MutationObserver(() => {
      maybeLoad();
      sync();
    });
    nearObserver.observe(panel);
    seen.observe(panel);
    welcome.observe(html, { attributes: true, attributeFilter: ['data-welcome'] });
    return () => {
      disposed = true;
      nearObserver.disconnect();
      seen.disconnect();
      welcome.disconnect();
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, []);

  useEffect(() => {
    activeRef.current = active;
    syncRef.current();
  }, [active]);

  return (
    <div ref={panelRef} className={`holo-panel ${className}`} data-status={status}>
      <canvas ref={canvasRef} className="holo-canvas" role="img" aria-label={t('hologram.alt')} />
      <p className="holo-label" aria-hidden="true">
        <span className="holo-dot" />
        {status === 'error' ? t('hologram.error') : status === 'ready' ? t('hologram.label') : t('hologram.loading')}
      </p>
    </div>
  );
}
