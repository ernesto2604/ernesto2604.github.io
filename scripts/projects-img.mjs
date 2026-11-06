// Builds src/assets/projects/<slug>.webp from the full-size photos in assets-src/projects-original (never touched).
// The project mask shows a centred 500x500 CSS px square of each photo (preserveAspectRatio slice), so a centred
// 1000x1000 crop covers 2x screens with the same framing; Vite hashes the output,
// so hosts can cache it forever. Run: node scripts/projects-img.mjs [quality]
import { mkdir, readdir, stat } from 'node:fs/promises';
import sharp from 'sharp';

const SRC = 'assets-src/projects-original';
const OUT = 'src/assets/projects';
const quality = Number(process.argv[2] ?? 78);

await mkdir(OUT, { recursive: true });
for (const file of (await readdir(SRC)).filter((f) => f.endsWith('.jpg'))) {
  const out = `${OUT}/${file.replace(/\.jpg$/, '.webp')}`;
  await sharp(`${SRC}/${file}`).rotate().resize({ width: 1000, height: 1000, fit: 'cover', position: 'centre' }).webp({ quality, effort: 6 }).toFile(out);
  const kb = async (f) => Math.round((await stat(f)).size / 1024);
  console.log(`${file} ${await kb(`${SRC}/${file}`)} kB -> ${out} ${await kb(out)} kB`);
}
