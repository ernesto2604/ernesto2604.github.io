import { useEffect, useState } from 'react';

// True once the welcome loader has lifted (public/welcome.js removes html[data-welcome]).
export function useWelcomeDone() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const html = document.documentElement;
    const check = () => !html.hasAttribute('data-welcome') && setDone(true);
    const observer = new MutationObserver(check);
    observer.observe(html, { attributes: true, attributeFilter: ['data-welcome'] });
    check();
    return () => observer.disconnect();
  }, []);
  return done;
}
