import { useEffect, useState } from 'react';
import { STAGES, type Stage } from '../lib/stages';

// The active stage is the one crossing the middle band of the viewport.
export function useActiveStage(): Stage {
  const [active, setActive] = useState<Stage>('input');
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id as Stage)),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    STAGES.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);
  return active;
}
