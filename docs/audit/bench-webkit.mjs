// WebKit (Safari engine) runtime bench: rAF frame intervals per section, idle and while scrolling.
// Usage (with `npm run preview` up): node docs/audit/bench-webkit.mjs <url> <label> [idle,hover,scroll]
// Env: CSS='...' injects a stylesheet for A/B tests; HEADED=1 shows the window.
import { webkit } from 'playwright';

const [url = 'http://localhost:4173/', label = 'run', only = 'idle,hover,scroll'] = process.argv.slice(2);
const want = new Set(only.split(','));
const browser = await webkit.launch({ headless: !process.env.HEADED });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await ctx.addInitScript(() => { try { sessionStorage.setItem('welcomed', '1'); } catch {} });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'load' });
if (process.env.CSS) await page.addStyleTag({ content: process.env.CSS });
await page.waitForTimeout(2500);

const stats = (dts) => {
  const s = [...dts].sort((a, b) => a - b); const p = (q) => s[Math.floor(q * (s.length - 1))] ?? 0;
  const total = dts.reduce((a, b) => a + b, 0) || 1;
  return { n: s.length, fps: Math.round((1000 * s.length) / total), p50: +p(0.5).toFixed(1), p95: +p(0.95).toFixed(1), max: +(s.at(-1) ?? 0).toFixed(1), over33: s.filter((x) => x > 33.4).length };
};
const rec = () => page.evaluate(() => {
  const f = []; let last = performance.now(); window.__run = true;
  const tick = (t) => { f.push({ dt: t - last, y: scrollY }); last = t; if (window.__run) requestAnimationFrame(tick); };
  requestAnimationFrame(tick); window.__f = f;
});
const stop = () => page.evaluate(() => { window.__run = false; return window.__f.slice(1); });

const sections = await page.evaluate(() => [...document.querySelectorAll('main > section, main > div > section, footer, [data-stage]')]
  .map((el) => ({ id: el.id || el.getAttribute('data-stage') || el.tagName.toLowerCase(), y: Math.round(el.getBoundingClientRect().top + scrollY), h: Math.round(el.getBoundingClientRect().height) }))
  .filter((s, i, a) => a.findIndex((x) => x.id === s.id) === i).sort((a, b) => a.y - b.y));
const out = { label, url, sections, idle: {}, results: {} };

if (want.has('idle')) {
  for (const s of sections) {
    await page.evaluate((y) => window.scrollTo(0, y), s.y + 100); await page.waitForTimeout(1200);
    await rec(); await page.waitForTimeout(3000); out.idle[s.id] = stats((await stop()).map((f) => f.dt));
  }
}
if (want.has('hover')) {
  await page.evaluate(() => document.querySelector('#generate li button').scrollIntoView({ block: 'center' })); await page.waitForTimeout(1200);
  const btns = await page.$$('#generate li button');
  await rec(); for (let i = 0; i < 9; i++) { await btns[i % 3].hover(); await page.waitForTimeout(700); }
  out.results.hover = stats((await stop()).map((f) => f.dt));
}
if (want.has('scroll')) {
  await page.evaluate(() => window.scrollTo(0, 0)); await page.mouse.move(700, 450); await page.waitForTimeout(1200);
  const H = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  await rec();
  for (let y = 0; y < H + 1500; y += 80) { await page.mouse.wheel(0, 80); await page.waitForTimeout(16); }
  await page.waitForTimeout(800);
  const fr = await stop();
  out.results.scroll = stats(fr.map((f) => f.dt));
  const per = {};
  for (const f of fr) { let id = sections[0]?.id; for (const s of sections) if (f.y + 450 >= s.y) id = s.id; (per[id] ||= []).push(f.dt); }
  out.results.scrollPerSection = Object.fromEntries(Object.entries(per).map(([k, v]) => [k, stats(v)]));
}
console.log(JSON.stringify(out));
await browser.close();
