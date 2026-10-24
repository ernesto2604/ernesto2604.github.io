// Inlined into <head> by scripts/prerender.mjs. Runs before first paint.
(function () {
  var d = document.documentElement;
  d.classList.add('js');
  try {
    var n = navigator;
    // Provisional weak-GPU heuristic (spec §5): solid surfaces instead of backdrop blur.
    if ((n.hardwareConcurrency && n.hardwareConcurrency <= 4) || (n.deviceMemory && n.deviceMemory <= 4)) d.setAttribute('data-lite', '');
    // Pinned story mode (spec §12b). Keep in sync with PINNED_QUERY in src/lib/scroll.ts.
    if (matchMedia('(min-width: 1024px) and (min-height: 740px) and (prefers-reduced-motion: no-preference)').matches) d.setAttribute('data-pinned', '');
  } catch (e) {}
  try {
    // Welcome loader (public/welcome.js): once per session, never with reduced motion or blocked storage.
    if (!sessionStorage.getItem('welcomed') && !matchMedia('(prefers-reduced-motion: reduce)').matches) d.setAttribute('data-welcome', '');
  } catch (e) {}
  try {
    // Honor a stored language choice once; never redirect on /es/ so this cannot loop.
    var p = location.pathname;
    if (localStorage.getItem('locale') === 'es' && (p === '/' || p === '/index.html')) location.replace('/es/' + location.hash);
  } catch (e) {}
})();
