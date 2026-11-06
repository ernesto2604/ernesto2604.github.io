// Real Safari bench over WebDriver (safaridriver, no extra deps): rAF frame intervals per section, hover and wheel scroll.
// Needs Safari > Settings > Developer > "Allow remote automation" and `safaridriver -p 4444` running.
// Usage: node docs/audit/bench-safari.mjs <url> <label> [idle,hover,scroll]   Env: CSS='...' injects a stylesheet (A/B).
const [url = 'http://localhost:4173/', label = 'run', only = 'idle,hover,scroll'] = process.argv.slice(2);
const want = new Set(only.split(','));
const D = 'http://localhost:4444';
const call = async (method, path, body) => {
  const r = await fetch(D + path, { method, headers: { 'content-type': 'application/json' }, body: body && JSON.stringify(body) });
  const j = await r.json();
  if (j.value?.error) throw new Error(`${path}: ${j.value.error} ${j.value.message}`);
  return j.value;
};
const { sessionId: id } = await call('POST', '/session', { capabilities: { alwaysMatch: { browserName: 'safari' } } });
const S = `/session/${id}`;
const js = (fn, ...args) => call('POST', `${S}/execute/sync`, { script: `return (${fn}).apply(null, arguments)`, args });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const stats = (dts) => {
  const s = [...dts].sort((a, b) => a - b); const p = (q) => s[Math.floor(q * (s.length - 1))] ?? 0;
  const total = dts.reduce((a, b) => a + b, 0) || 1;
  return { n: s.length, fps: Math.round((1000 * s.length) / total), p95: Math.round(p(0.95)), max: Math.round(s.at(-1) ?? 0), over33: s.filter((x) => x > 33.4).length };
};
const rec = () => js(() => { const f = []; let l = performance.now(); window.__run = true; window.__f = f; const t = (n) => { f.push({ dt: n - l, y: scrollY }); l = n; if (window.__run) requestAnimationFrame(t); }; requestAnimationFrame(t); });
const stop = () => js(() => { window.__run = false; return window.__f.slice(1); });

try {
  await call('POST', `${S}/timeouts`, { script: 120000 });
  await call('POST', `${S}/window/rect`, { x: 0, y: 0, width: 1440, height: 1000 });
  await call('POST', `${S}/url`, { url });
  await js(() => sessionStorage.setItem('welcomed', '1'));
  await call('POST', `${S}/url`, { url: url + '?b=' + Date.now() }); // new navigation: no welcome loader
  await wait(3000);
  if (process.env.CSS) await js((c) => { const s = document.createElement('style'); s.textContent = c; document.head.append(s); }, process.env.CSS);
  const env = await js(() => ({ w: innerWidth, h: innerHeight, dpr: devicePixelRatio, pinned: document.documentElement.hasAttribute('data-pinned'), lite: document.documentElement.hasAttribute('data-lite'), ua: navigator.userAgent.match(/Version\/[\d.]+/)?.[0] }));
  const sections = await js(() => ['input', 'generate', 'skills', 'output'].map((id) => ({ id, y: Math.round(document.getElementById(id).getBoundingClientRect().top + scrollY) })).concat([{ id: 'footer', y: Math.round(document.querySelector('footer').getBoundingClientRect().top + scrollY) }]));
  const out = { label, env, idle: {}, results: {} };
  if (want.has('idle')) {
    for (const s of sections) {
      await js((y) => window.scrollTo(0, y), s.y + 100); await wait(1500);
      await rec(); await wait(4000); out.idle[s.id] = stats((await stop()).map((f) => f.dt));
    }
  }
  if (want.has('hover')) {
    await js(() => document.querySelector('#generate li button').scrollIntoView({ block: 'center' })); await wait(1500);
    const els = await call('POST', `${S}/elements`, { using: 'css selector', value: '#generate li button' });
    await rec();
    for (let i = 0; i < 9; i++) {
      await call('POST', `${S}/actions`, { actions: [{ type: 'pointer', id: 'm', parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerMove', duration: 100, origin: els[i % 3], x: 0, y: 0 }] }] });
      await wait(600);
    }
    out.results.hover = stats((await stop()).map((f) => f.dt));
  }
  if (want.has('scroll')) {
    await js(() => window.scrollTo(0, 0)); await wait(1500);
    // safaridriver wheel actions do not move the page, so scroll from inside it: 24 px per frame (~1440 px/s), like a steady trackpad.
    await rec();
    await call('POST', `${S}/execute/async`, { script: `const done = arguments[0]; const H = document.documentElement.scrollHeight - innerHeight; const step = () => { if (scrollY >= H - 2) return setTimeout(done, 800); window.scrollBy(0, 24); requestAnimationFrame(step); }; requestAnimationFrame(step);`, args: [] });
    const fr = await stop();
    out.results.scroll = stats(fr.map((f) => f.dt));
    const per = {};
    for (const f of fr) { let s = sections[0].id; for (const x of sections) if (f.y + 450 >= x.y) s = x.id; (per[s] ||= []).push(f.dt); }
    out.results.scrollPerSection = Object.fromEntries(Object.entries(per).map(([k, v]) => [k, stats(v)]));
    out.results.scrollEndY = fr.at(-1)?.y;
  }
  console.log(JSON.stringify(out));
} finally {
  await call('DELETE', S).catch(() => {});
}
