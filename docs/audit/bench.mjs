// Runtime perf bench: headless Chrome + CDP, 1440x900 @2x, welcome loader skipped.
// Usage (with `npm run preview` up): node docs/audit/bench.mjs <url> <cpuRate> <label> [idle,hover,scroll]
// Env: NET=1 throttles to Fast 4G (150 ms RTT, 9 Mbps); CSS='...' injects a stylesheet for A/B tests.
import { chromium } from 'playwright';

const [url = 'http://localhost:4173/', cpu = '1', label = 'run', only = 'idle,hover,scroll'] = process.argv.slice(2);
const want = new Set(only.split(','));
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=metal', '--enable-gpu-rasterization'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await ctx.addInitScript(() => { try { sessionStorage.setItem('welcomed', '1'); } catch {} });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
if (process.env.NET) { await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 9e6 / 8, uploadThroughput: 1.5e6 / 8 }); }
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(+(process.env.WAIT || 0));
if (process.env.CSS) await page.addStyleTag({ content: process.env.CSS });
await page.waitForTimeout(1500);
if (+cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: +cpu });

await page.evaluate(() => {
  window.__rec = () => {
    const frames = [], loafs = []; let last = performance.now(), run = true;
    const po = new PerformanceObserver((l) => l.getEntries().forEach((e) => loafs.push({ t: e.startTime, d: e.duration, y: scrollY, scripts: (e.scripts || []).slice(0, 2).map((s) => `${s.invoker}:${Math.round(s.duration)}`) })));
    po.observe({ type: 'long-animation-frame' });
    const tick = (t) => { frames.push({ dt: t - last, y: scrollY }); last = t; if (run) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    return () => { run = false; po.disconnect(); return { frames: frames.slice(1), loafs }; };
  };
});

const stats = (dts) => {
  const s = [...dts].sort((a, b) => a - b); const p = (q) => s[Math.floor(q * (s.length - 1))] ?? 0;
  const total = dts.reduce((a, b) => a + b, 0);
  return { n: s.length, fps: Math.round((1000 * s.length) / total), p50: +p(0.5).toFixed(1), p95: +p(0.95).toFixed(1), max: +(s.at(-1) ?? 0).toFixed(1), over33: s.filter((x) => x > 33.4).length };
};

async function traced(name, fn) {
  const events = [];
  cdp.on('Tracing.dataCollected', (d) => events.push(...d.value));
  const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline', transferMode: 'ReportEvents' });
  await page.evaluate(() => (window.__stop = window.__rec()));
  await fn();
  const rec = await page.evaluate(() => window.__stop());
  await cdp.send('Tracing.end'); await done;
  cdp.removeAllListeners('Tracing.dataCollected');
  const agg = {};
  for (const e of events) if (e.ph === 'X' && e.dur) agg[e.name] = (agg[e.name] || 0) + e.dur / 1000;
  const top = Object.entries(agg).filter(([k]) => /Paint|Raster|Decode|Layout|UpdateLayer|Composite|RecalculateStyles|FunctionCall|ParseHTML|EvaluateScript|PrePaint|Layerize|Commit|ImageDecode|GPUTask|RunTask/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `${k}=${Math.round(v)}ms`);
  const tn={}; for (const e of events) if (e.ph==='M'&&e.name==='thread_name') tn[e.pid+':'+e.tid]=e.args.name;
  const longEv = events.filter((e) => e.ph === 'X' && e.dur > 25000 && e.name !== 'RunTask' && e.name!=='ThreadControllerImpl::RunTask').sort((a,b)=>b.dur-a.dur).slice(0,10).map((e) => `${e.name}[${tn[e.pid+':'+e.tid]||e.tid}]=${Math.round(e.dur/1000)}ms ${e.args?.data?.url?.split('/').pop()||''}`);
  return { name, longEv, ...stats(rec.frames.map((f) => f.dt)), loafN: rec.loafs.length, loafMax: Math.round(Math.max(0, ...rec.loafs.map((l) => l.d))), loafTop: rec.loafs.sort((a, b) => b.d - a.d).slice(0, 3).map((l) => `${Math.round(l.d)}ms y=${Math.round(l.y)} ${l.scripts.join('|')}`), trace: top, frames: rec.frames };
}

const out = { label, cpu: +cpu, url, results: [] };
if (want.has('idle') || want.has('hover')) {
  await page.evaluate(() => { const g = document.getElementById('generate'); window.scrollTo(0, g.offsetTop + 300); });
  await page.waitForTimeout(1500);
}
if (want.has('idle')) out.results.push(await traced('generate-idle-6s', () => page.waitForTimeout(6000)));
if (want.has('hover')) {
  out.results.push(await traced('generate-hover-cycle', async () => {
    const btns = await page.$$('#generate li button');
    for (let i = 0; i < 9; i++) { await btns[i % 3].hover(); await page.waitForTimeout(700); }
  }));
}
if (want.has('scroll')) {
  await page.evaluate(() => window.scrollTo(0, 0)); await page.mouse.move(700, 450); await page.waitForTimeout(1200);
  const secs = await page.evaluate(() => ['top', 'story', 'generate', 'stack', 'output', 'contact', 'footer'].map((id) => { const el = id === 'top' ? document.body : (document.getElementById(id) || document.querySelector(id)); return el ? { id, y: el.getBoundingClientRect().top + scrollY } : null; }).filter(Boolean));
  const H = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const r = await traced('full-scroll', async () => {
    for (let y = 0; y < H + 2000; y += 80) { await page.mouse.wheel(0, 80); await page.waitForTimeout(16); }
    await page.waitForTimeout(800);
  });
  secs.sort((a, b) => a.y - b.y);
  const per = {};
  for (const f of r.frames) { let s = secs[0].id; for (const x of secs) if (f.y + 450 >= x.y) s = x.id; (per[s] ||= []).push(f.dt); }
  r.perSection = Object.fromEntries(Object.entries(per).map(([k, v]) => [k, stats(v)]));
  r.sections = secs;
  out.results.push(r);
}
for (const r of out.results) delete r.frames;
const gpu = await page.evaluate(() => { const c = document.createElement('canvas').getContext('webgl'); const d = c?.getExtension('WEBGL_debug_renderer_info'); return d ? c.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'n/a'; });
out.gpu = gpu;
out.resources = await page.evaluate(() => performance.getEntriesByType('resource').filter((r) => /jpg|glb|woff2|hologram|index-.*js/.test(r.name)).map((r) => `${r.name.split('/').pop()} start=${Math.round(r.startTime)} end=${Math.round(r.responseEnd)} kB=${Math.round(r.transferSize / 1024)}`));
console.log(JSON.stringify(out, null, 1));
await browser.close();
