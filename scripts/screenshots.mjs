// Dev aid: screenshots of the built site at given scroll positions.
// Usage: node scripts/screenshots.mjs <outDir> <width>x<height> <path> <scrollY|#hash>...
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const [outDir, size, path, ...points] = process.argv.slice(2);
const [width, height] = size.split('x').map(Number);
await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height }, reducedMotion: process.env.REDUCED ? 'reduce' : 'no-preference' });
await page.goto(`http://localhost:4173${path}`);
await page.waitForTimeout(1800);
for (const [i, point] of points.entries()) {
  if (point.startsWith('#')) await page.evaluate((h) => document.querySelector(`a[href="${h}"]`)?.click() ?? (location.hash = h), point);
  else await page.evaluate((y) => window.scrollTo(0, y), Number(point));
  await page.waitForTimeout(1400);
  const file = `${outDir}/${String(i).padStart(2, '0')}-${point.replace(/[^\w]/g, '')}.png`;
  await page.screenshot({ path: file });
  console.log(file);
}
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await browser.close();
if (errors.length) console.log('console errors:', errors);
