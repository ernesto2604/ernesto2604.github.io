// Builds the PNG icons from public/favicon.svg (the EC monogram in a neutral circle).
// Run: node scripts/favicon.mjs after editing the SVG.
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const svg = await readFile('public/favicon.svg');
const GROUND = '#E3E6EB'; // keep in sync with the circle fill in favicon.svg

const render = (size) => sharp(svg, { density: Math.ceil((72 * size) / 64) }).resize(size, size).png({ compressionLevel: 9 });

// Tabs and the PWA get the circle; iOS masks its own shape, so the touch icon gets a full square ground.
await render(32).toFile('public/icon-32.png');
await render(192).toFile('public/icon-192.png');
await render(512).toFile('public/icon-512.png');
await sharp({ create: { width: 180, height: 180, channels: 4, background: GROUND } })
  .composite([{ input: await render(180).toBuffer() }])
  .png({ compressionLevel: 9 })
  .toFile('public/apple-touch-icon.png');
console.log('icons written');
