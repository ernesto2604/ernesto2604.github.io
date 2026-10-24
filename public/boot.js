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
  var reload = false;
  try {
    // A reload (F5) starts over: back to the hero with the loader, instead of the last hash and scroll position.
    // A new navigation to a deep link (#rerank shared elsewhere) still lands on its section.
    var nav = performance.getEntriesByType('navigation')[0];
    reload = !!nav && nav.type === 'reload';
    if (reload) {
      history.scrollRestoration = 'manual';
      if (location.hash) history.replaceState(history.state, '', location.pathname + location.search);
      // The entry was saved with automatic restoration, so Chrome still restores it around load: undo that.
      var top = function () { scrollTo(0, 0); };
      addEventListener('load', function () { top(); setTimeout(top, 0); });
    }
  } catch (e) {}
  try {
    // Welcome loader (public/welcome.js): once per session, again on reload or with ?welcome; never with reduced motion or blocked storage.
    var seen = sessionStorage.getItem('welcomed') && !reload && !/[?&]welcome\b/.test(location.search);
    if (!seen && !matchMedia('(prefers-reduced-motion: reduce)').matches) d.setAttribute('data-welcome', '');
  } catch (e) {}
  try {
    // Honor a stored language choice once; never redirect on /es/ so this cannot loop.
    var p = location.pathname;
    if (localStorage.getItem('locale') === 'es' && (p === '/' || p === '/index.html')) location.replace('/es/' + location.hash);
  } catch (e) {}
})();
