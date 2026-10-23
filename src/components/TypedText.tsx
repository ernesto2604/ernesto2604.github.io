import { useEffect, useState } from 'react';
import { useReducedMotion } from '../hooks/useMedia';

// Types `text` once after hydration. Server HTML holds the full text (no-JS and crawlers see it);
// CSS hides [data-typing="pending"] on .js pages until typing starts, so nothing flashes.
export default function TypedText({ text, msPerChar = 28 }: { text: string; msPerChar?: number }) {
  const reduced = useReducedMotion();
  const [count, setCount] = useState(text.length);
  const [state, setState] = useState<'pending' | 'typing' | 'done'>('pending');

  useEffect(() => {
    if (reduced) {
      setCount(text.length);
      setState('done');
      return;
    }
    setCount(0);
    setState('typing');
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= text.length) {
        window.clearInterval(id);
        setState('done');
      }
    }, msPerChar);
    return () => window.clearInterval(id);
  }, [text, msPerChar, reduced]);

  return (
    <span data-typing={state}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{text.slice(0, count)}</span>
      <span aria-hidden="true" className="caret" />
    </span>
  );
}
