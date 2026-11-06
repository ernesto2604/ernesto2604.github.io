// Builds public/models/ernesto.glb from assets-src/modelo3d.glb (the original is never touched).
// The hologram shader only samples the base color, so normal and ORM maps are dropped,
// the mesh is simplified (a 2M-triangle scan is far denser than a ~500px canvas can show)
// and the base color goes to WebP. Run: node scripts/optimize-model.mjs [ratio] [texture px] [source]
// The source may be an already optimized model (e.g. a copy of public/models/ernesto.glb) to shrink it further.
import { mkdir, stat } from 'node:fs/promises';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, meshopt, prune, simplify, textureCompress, weld } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const SRC = process.argv[4] ?? 'assets-src/modelo3d.glb';
const OUT = 'public/models/ernesto.glb';
const ratio = Number(process.argv[2] ?? 0.12);
const texture = Number(process.argv[3] ?? 2048);

await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready]);
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });

const doc = await io.read(SRC);
for (const material of doc.getRoot().listMaterials()) {
  material.setNormalTexture(null).setMetallicRoughnessTexture(null).setOcclusionTexture(null);
}

await doc.transform(
  prune(),
  dedup(),
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.0008 }),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [texture, texture], quality: 82 }),
  prune(),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
);

await mkdir('public/models', { recursive: true });
await io.write(OUT, doc);
const mb = async (f) => ((await stat(f)).size / 1048576).toFixed(2);
console.log(`${SRC} ${await mb(SRC)} MB -> ${OUT} ${await mb(OUT)} MB`);
