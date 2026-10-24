// Inlined right after the welcome overlay by scripts/prerender.mjs. boot.js sets html[data-welcome] before first
// paint (JS on, motion allowed, not yet seen this session); without it the overlay stays display:none.
// Plays the words one at a time, ends on the page language, then fades into the hero. Click or any key skips.
(function () {
  var d = document.documentElement;
  var el = document.getElementById('welcome');
  var timers = [];
  function end() {
    if (!d.hasAttribute('data-welcome')) return;
    timers.forEach(clearTimeout);
    removeEventListener('keydown', end, true);
    removeEventListener('pointerdown', end, true);
    if (el) el.setAttribute('data-done', '');
    d.removeAttribute('data-welcome');
  }
  try {
    if (!el || !d.hasAttribute('data-welcome')) return end();
    try {
      sessionStorage.setItem('welcomed', '1');
    } catch (e) {}
    var words = JSON.parse(el.getAttribute('data-words'));
    var step = +el.getAttribute('data-step');
    var word = el.firstElementChild;
    words.forEach(function (w, i) {
      if (i) timers.push(setTimeout(function () { word.textContent = w; }, i * step));
    });
    timers.push(setTimeout(end, words.length * step));
    addEventListener('keydown', end, true);
    addEventListener('pointerdown', end, true);
  } catch (e) {
    end();
  }
})();
