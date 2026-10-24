// Builds the site icons from the portrait cutout: the face in a circle on a neutral ground.
// Run: node scripts/favicon.mjs (needs public/photo/ernesto-960.webp from scripts/photo.py).
import sharp from 'sharp';

const SRC = 'public/photo/ernesto-960.webp';
const GROUND = '#E3E6EB'; // neutral, a step darker than --bg-1 so the circle reads on light browser tabs
// Square crop around the head in the 960x931 cutout (chosen by eye; update if the photo changes).
const CROP = { left: 110, top: 0, width: 740, height: 740 };

const face = await sharp(SRC).extract(CROP).toBuffer();

async function icon(size, circle) {
  const photo = await sharp(face).resize(size, size).toBuffer();
  const ground = Buffer.from(`<svg width="${size}" height="${size}"><rect width="100%" height="100%" fill="${GROUND}"/></svg>`);
  let img = sharp(ground).composite([{ input: photo }]);
  if (circle) {
    const mask = Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/></svg>`);
    img = sharp(await img.png().toBuffer()).composite([{ input: mask, blend: 'dest-in' }]);
  }
  return img.png({ compressionLevel: 9 });
}

// Tabs and the PWA get the circle; iOS masks its own shape, so the touch icon stays square.
await (await icon(32, true)).toFile('public/icon-32.png');
await (await icon(192, true)).toFile('public/icon-192.png');
await (await icon(512, true)).toFile('public/icon-512.png');
await (await icon(180, false)).toFile('public/apple-touch-icon.png');
console.log('icons written');
