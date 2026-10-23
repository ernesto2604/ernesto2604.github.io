import { useEffect, useState } from 'react';
import type { Stage } from '../lib/stages';

// Active stage = the last stage start that has crossed 45% of the viewport.
// Stage starts are [data-stage] elements; story stages have a pinned marker and a stacked block,
// and only the one for the current mode counts.
export function useActiveStage(): Stage {
  const [active, setActive] = useState<Stage>('input');
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const pinned = document.documentElement.hasAttribute('data-pinned');
      let current: Stage = 'input';
      for (const el of document.querySelectorAll<HTMLElement>('[data-stage]')) {
        const mode = el.dataset.mode;
        if (mode && mode !== (pinned ? 'pinned' : 'stacked')) continue;
        if (el.getBoundingClientRect().top <= innerHeight * 0.45) current = el.dataset.stage as Stage;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    update();
    return () => {
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return active;
}
