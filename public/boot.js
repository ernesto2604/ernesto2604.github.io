// Inlined into <head> by scripts/prerender.mjs. Runs before first paint.
(function () {
  var d = document.documentElement;
  d.classList.add('js');
  try {
    var n = navigator;
    // Provisional weak-GPU heuristic (spec §5): solid surfaces instead of backdrop blur.
    if ((n.hardwareConcurrency && n.hardwareConcurrency <= 4) || (n.deviceMemory && n.deviceMemory <= 4)) d.setAttribute('data-lite', '');
  } catch (e) {}
  try {
    // Honor a stored language choice once; never redirect on /es/ so this cannot loop.
    var p = location.pathname;
    if (localStorage.getItem('locale') === 'es' && (p === '/' || p === '/index.html')) location.replace('/es/' + location.hash);
  } catch (e) {}
})();
