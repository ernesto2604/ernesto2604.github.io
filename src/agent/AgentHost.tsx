import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useT } from '../i18n';

const AgentPanel = lazy(() => import('./AgentPanel'));
export const preloadAgent = () => void import('./AgentPanel');

// Owns the native <dialog> (modal: inert background, Escape to close, focus returns to the opener).
// The panel code loads on first open, on Ctrl/Cmd+K, or when the browser is idle after load.
export default function AgentHost() {
  const t = useT();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const open = () => {
      setMounted(true);
      const d = dialogRef.current!;
      if (!d.open) d.showModal();
      requestAnimationFrame(() => d.querySelector<HTMLInputElement>('#agent-input')?.focus());
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (dialogRef.current?.open) dialogRef.current.close();
        else open();
      }
    };
    addEventListener('agent:open', open);
    addEventListener('keydown', onKey);
    const idle = 'requestIdleCallback' in window ? requestIdleCallback(preloadAgent) : setTimeout(preloadAgent, 2500);
    return () => {
      removeEventListener('agent:open', open);
      removeEventListener('keydown', onKey);
      if ('cancelIdleCallback' in window) cancelIdleCallback(idle as number);
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      data-lenis-prevent
      aria-label={t('agent.title')}
      className="agent-dialog glass m-auto mt-[10svh] w-[min(42rem,calc(100vw-1.5rem))] rounded-panel p-0 text-text"
      onClick={(e) => e.target === e.currentTarget && dialogRef.current?.close()}
    >
      {mounted && (
        <Suspense fallback={<div className="h-40" />}>
          <AgentPanel dialogRef={dialogRef} />
        </Suspense>
      )}
    </dialog>
  );
}
