// Inlined right after the welcome overlay by scripts/prerender.mjs. boot.js sets html[data-welcome] before first
// paint (JS on, motion allowed, not yet seen this session); without it the overlay stays display:none.
// The CSS reel slides through the words and slows to a stop on Welcome; this holds it, then dives into the counter
// of its "o" and comes out on the hero (src/lib/welcome.ts sets the timing). Click or any key skips.
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
  // Scale up from the middle of the "o" while it slides to the centre of the screen, so its counter (paper, like
  // the page) grows evenly over the whole screen.
  function dive() {
    var word = el.querySelector('.welcome-word:last-child');
    var text = word.firstChild;
    var i = word.textContent.indexOf('o');
    if (i >= 0 && text) {
      var range = document.createRange();
      range.setStart(text, i);
      range.setEnd(text, i + 1);
      var o = range.getBoundingClientRect();
      var box = word.getBoundingClientRect();
      // Centre of the ink, not of the line box: the range's top sits fontBoundingBoxAscent above the baseline.
      var ctx = document.createElement('canvas').getContext('2d');
      ctx.font = getComputedStyle(word).font;
      var m = ctx.measureText('o');
      var x = o.left + (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2;
      var y = m.fontBoundingBoxAscent
        ? o.top + m.fontBoundingBoxAscent - (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2
        : o.top + o.height * 0.55;
      word.style.transformOrigin = x - box.left + 'px ' + (y - box.top) + 'px';
      word.style.setProperty('--dx', innerWidth / 2 - x + 'px');
      word.style.setProperty('--dy', innerHeight / 2 - y + 'px');
    }
    el.setAttribute('data-zoom', '');
    var ms = parseFloat(getComputedStyle(el).getPropertyValue('--zoom-ms')) || 2400;
    timers.push(setTimeout(end, ms));
  }
  try {
    if (!el || !d.hasAttribute('data-welcome')) return end();
    try {
      sessionStorage.setItem('welcomed', '1');
    } catch (e) {}
    var reel = parseFloat(getComputedStyle(el).getPropertyValue('--reel-ms')) || 3400;
    timers.push(setTimeout(dive, reel + +el.getAttribute('data-hold')));
    addEventListener('keydown', end, true);
    addEventListener('pointerdown', end, true);
  } catch (e) {
    end();
  }
})();
