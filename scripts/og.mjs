// Renders the Open Graph images and PNG icons with Playwright's Chromium (same fonts as the site).
// Run after changing the name, role or brand: `npm run og`. Outputs are committed in public/.
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const font = async (file) => `data:font/woff2;base64,${(await readFile(new URL(`public/fonts/${file}`, root))).toString('base64')}`;
const messages = {
  en: JSON.parse(await readFile(new URL('src/content/en.json', root), 'utf8')),
  es: JSON.parse(await readFile(new URL('src/content/es.json', root), 'utf8')),
};
const serif = await font('newsreader-latin-wght-normal.woff2');
const sans = await font('geist-latin-wght-normal.woff2');

const og = (m) => `<!doctype html><html><head><style>
@font-face { font-family: N; src: url(${serif}); font-weight: 200 800; }
@font-face { font-family: G; src: url(${sans}); font-weight: 100 900; }
html, body { margin: 0; width: 1200px; height: 630px; background: #07090E; color: #ECEFF4; font-family: G; }
body { position: relative; overflow: hidden; padding: 72px 80px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; }
.glow { position: absolute; width: 900px; height: 900px; right: -380px; top: -460px; border-radius: 50%; background: radial-gradient(closest-side, rgba(255,181,71,.22), transparent); }
.q { font-family: N; font-weight: 300; font-size: 40px; color: #A3ACBB; display: flex; align-items: center; gap: 18px; }
.dot { width: 14px; height: 14px; border-radius: 50%; background: #FFB547; flex: none; }
h1 { font-family: N; font-weight: 300; font-size: 132px; line-height: .95; letter-spacing: -0.02em; margin: 0; }
.role { font-size: 34px; font-weight: 500; margin-top: 22px; }
.meta { font-size: 24px; color: #A3ACBB; }
</style></head><body><div class="glow"></div>
<div class="q"><span class="dot"></span>${m.hero.query}</div>
<div><h1>${m.hero.name}</h1><div class="role">${m.hero.role}</div></div>
<div class="meta">${m.hero.location} · ${m.hero.availability}</div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const locale of ['en', 'es']) {
  await page.setContent(og(messages[locale]));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `public/og-${locale}.png` });
}
const svg = await readFile(new URL('public/favicon.svg', root), 'utf8');
for (const size of [32, 180, 192, 512]) {
  const icon = await browser.newPage({ viewport: { width: size, height: size } });
  await icon.setContent(`<html><body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  await icon.screenshot({ path: `public/${size === 180 ? 'apple-touch-icon' : `icon-${size}`}.png`, omitBackground: true });
  await icon.close();
}
await browser.close();
console.log('[og] wrote public/og-en.png, public/og-es.png and icons');
