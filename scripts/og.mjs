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
const inter = await font('inter-latin-opsz-normal.woff2');
// Colors come from the site's tokens so the card always matches the live palette.
const tokens = await readFile(new URL('src/styles/tokens.css', root), 'utf8');
const c = (name) => tokens.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))[1];
const photo = `data:image/webp;base64,${(await readFile(new URL('public/photo/ernesto-640.webp', root))).toString('base64')}`;
const host = new URL(JSON.parse(await readFile(new URL('src/content/profile.json', root), 'utf8')).siteUrl).host;

const og = (m) => `<!doctype html><html><head><style>
@font-face { font-family: I; src: url(${inter}); font-weight: 100 900; }
html, body { margin: 0; width: 1200px; height: 630px; background: ${c('bg-0')}; color: ${c('text')}; font-family: I; }
body { box-sizing: border-box; padding: 64px 0 0 80px; display: grid; grid-template-columns: 1fr 440px; column-gap: 48px; }
.copy { display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 64px; }
.name { font-size: 34px; font-weight: 600; letter-spacing: -0.02em; display: flex; align-items: center; gap: 16px; }
.dot { width: 14px; height: 14px; border-radius: 50%; background: ${c('accent-fill')}; }
h1 { font-size: 150px; font-weight: 560; line-height: .9; letter-spacing: -0.05em; margin: 0; }
.host { font-size: 24px; color: ${c('text-muted')}; }
.photo { align-self: end; height: 566px; border-radius: 28px 0 0 0; background: ${c('accent-fill')}38; display: flex; align-items: flex-end; overflow: hidden; }
.photo img { width: 100%; display: block; }
</style></head><body>
<div class="copy"><div class="name"><span class="dot"></span>${m.hero.name}</div><h1>${m.hero.role}</h1><div class="host">${host}</div></div>
<div class="photo"><img src="${photo}" alt=""></div>
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
