// Hologram scene for components/Hologram.tsx. Loaded with a dynamic import so three.js
// stays out of the main bundle and is only fetched when the section gets close.
import {
  AdditiveBlending,
  Box3,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  Mesh,
  NoColorSpace,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Texture,
  Vector3,
  WebGLRenderer,
  type Material,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

// Tuning knobs. Color is also exposed as --holo in tokens.css for the panel glow.
export const HOLO = {
  color: '#19f5d0',
  revealMs: 2500, // materialize duration
  sweepSeconds: 3.2, // one pass of the bright band, top to bottom
  textureMix: 0.55, // how much of the original texture shows through (0 = none)
  gridDensity: 46, // grid lines per model height
  swayRadians: 0.32, // idle rotation amplitude
  parallaxRadians: 0.22, // max extra rotation from the pointer
};

export type HologramOptions = { reducedMotion: boolean; lite: boolean };
export type HologramHandle = { reveal(): void; setVisible(visible: boolean): void; dispose(): void };

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uGlitch;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vWorld;

  float hash(float n) { return fract(sin(n) * 43758.5453); }

  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    // Glitch: a few thin horizontal slices jump sideways while uGlitch > 0.
    float slice = floor(world.y * 60.0 + floor(uTime * 24.0) * 7.0);
    world.x += uGlitch * step(0.93, hash(slice)) * (hash(slice + 1.0) - 0.5) * 0.06;
    vWorld = world.xyz;
    vec4 mv = viewMatrix * world;
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform sampler2D uMap;
  uniform float uHasMap;
  uniform float uTime;
  uniform float uReveal;
  uniform float uMinY;
  uniform float uMaxY;
  uniform float uFlicker;
  uniform float uSweep;
  uniform float uTexMix;
  uniform float uGrid;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vWorld;

  // Anti-aliased line at every integer of x.
  float gridLine(float x) {
    float d = abs(fract(x - 0.5) - 0.5) / max(fwidth(x), 1e-4);
    return 1.0 - min(d, 1.0);
  }

  void main() {
    float h = (vWorld.y - uMinY) / (uMaxY - uMinY);
    // The cut line runs from just below the feet (0) to just above the head (1).
    float cut = h - (uReveal * 1.1 - 0.05);
    if (cut > 0.0) discard;
    #ifdef DEPTH_ONLY
      gl_FragColor = vec4(0.0);
      return;
    #endif

    vec3 n = normalize(vNormal);
    if (!gl_FrontFacing) n = -n;
    float fresnel = pow(1.0 - clamp(abs(dot(n, normalize(vView))), 0.0, 1.0), 2.0);

    vec3 g = vWorld * uGrid / (uMaxY - uMinY);
    float grid = max(gridLine(g.y), max(gridLine(g.x), gridLine(g.z)) * 0.6);

    float lum = 0.0;
    if (uHasMap > 0.5) lum = dot(texture2D(uMap, vUv).rgb, vec3(0.299, 0.587, 0.114));

    float scan = 0.82 + 0.18 * sin(gl_FragCoord.y * 1.7);
    float bandAt = 1.08 - fract(uTime / uSweep) * 1.16;
    float band = exp(-pow((h - bandAt) * 16.0, 2.0)) * uFlicker;
    float edge = smoothstep(0.035, 0.0, -cut) * step(uReveal, 0.999);

    float body = 0.1 + lum * uTexMix + fresnel * 1.5 + grid * 0.55;
    vec3 col = uColor * body * scan + uColor * band * 0.9 + vec3(0.75, 1.0, 0.95) * edge * 2.2;
    float alpha = clamp((0.18 + lum * uTexMix * 0.7 + fresnel + grid * 0.5) * scan + band * 0.5 + edge, 0.0, 1.0);
    gl_FragColor = vec4(col * uFlicker, alpha * uFlicker);
  }
`;

// Sparks that rise off the cut line while the model materializes.
const sparkVertex = /* glsl */ `
  uniform float uTime;
  uniform float uEdgeY;
  uniform float uSize;
  attribute float aSeed;
  varying float vAlpha;
  void main() {
    float life = fract(uTime * 0.9 + aSeed);
    vec3 p = position;
    p.y = uEdgeY + life * 0.12;
    vAlpha = (1.0 - life) * (1.0 - life);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize * (0.5 + aSeed) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const sparkFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * vAlpha * uOpacity;
    gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.4) * a, a);
  }
`;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export async function createHologram(canvas: HTMLCanvasElement, url: string, opts: HologramOptions): Promise<HologramHandle> {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: !opts.lite, powerPreference: opts.lite ? 'low-power' : 'high-performance' });
  // Software WebGL (no GPU acceleration, headless browsers) cannot animate this mesh without
  // pinning the CPU, so it gets the same single static frame as reduced motion.
  const gl = renderer.getContext();
  const gpu = String(gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info')?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER));
  const animated = !opts.reducedMotion && !/swiftshader|llvmpipe|software|basic render/i.test(gpu);
  renderer.setPixelRatio(Math.min(devicePixelRatio, opts.lite ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(28, 1, 0.01, 20);
  const pivot = new Group();
  scene.add(pivot);

  const uniforms = {
    uColor: { value: new Color(HOLO.color) },
    uMap: { value: null as Texture | null },
    uHasMap: { value: 0 },
    uTime: { value: 0 },
    uReveal: { value: animated ? 0 : 1 },
    uMinY: { value: -0.5 },
    uMaxY: { value: 0.5 },
    uFlicker: { value: 1 },
    uSweep: { value: HOLO.sweepSeconds },
    uTexMix: { value: HOLO.textureMix },
    uGrid: { value: HOLO.gridDensity },
    uGlitch: { value: 0 },
  };
  // Depth pre-pass so only the nearest surface glows; without it the additive back faces turn into noise.
  const depthMaterial = new ShaderMaterial({ vertexShader, fragmentShader, uniforms, defines: { DEPTH_ONLY: '' }, colorWrite: false });
  const holoMaterial = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(url);
  const model = gltf.scene;
  const disposables: { dispose(): void }[] = [renderer, depthMaterial, holoMaterial];

  // Collect first: the loop adds child meshes, which traverse() would then visit forever.
  const meshes: Mesh[] = [];
  model.traverse((obj) => obj instanceof Mesh && meshes.push(obj));
  for (const obj of meshes) {
    const old = obj.material as Material & { map?: Texture | null };
    if (old.map && !uniforms.uMap.value) {
      old.map.colorSpace = NoColorSpace; // sample raw values, the shader only reads luminance
      old.map.needsUpdate = true;
      uniforms.uMap.value = old.map;
      uniforms.uHasMap.value = 1;
      disposables.push(old.map);
    }
    old.dispose();
    disposables.push(obj.geometry);
    obj.material = holoMaterial;
    obj.renderOrder = 1;
    const depth = new Mesh(obj.geometry, depthMaterial);
    depth.renderOrder = 0;
    obj.add(depth);
  }

  // The scan faces +X; turn it to face the camera. Then normalize: 1 unit tall, feet at y = -0.5, centered.
  model.rotation.y = -Math.PI / 2;
  const box = new Box3().setFromObject(model);
  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  model.scale.setScalar(1 / size.y);
  model.position.set(-center.x / size.y, -center.y / size.y, -center.z / size.y);
  pivot.add(model);
  const radius = Math.max(size.x, size.z) / size.y / 2;

  // Sparks: a ring of points around the body at the cut height.
  const sparkCount = opts.lite ? 90 : 260;
  const positions = new Float32Array(sparkCount * 3);
  const seeds = new Float32Array(sparkCount);
  for (let i = 0; i < sparkCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = radius * (0.4 + Math.random() * 0.8);
    positions.set([Math.cos(a) * r, 0, Math.sin(a) * r], i * 3);
    seeds[i] = Math.random();
  }
  const sparkGeometry = new BufferGeometry();
  sparkGeometry.setAttribute('position', new BufferAttribute(positions, 3));
  sparkGeometry.setAttribute('aSeed', new BufferAttribute(seeds, 1));
  const sparkUniforms = {
    uColor: uniforms.uColor,
    uTime: uniforms.uTime,
    uEdgeY: { value: -0.5 },
    uSize: { value: 26 * renderer.getPixelRatio() },
    uOpacity: { value: 0 },
  };
  const sparkMaterial = new ShaderMaterial({
    vertexShader: sparkVertex,
    fragmentShader: sparkFragment,
    uniforms: sparkUniforms,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
  });
  const sparks = new Points(sparkGeometry, sparkMaterial);
  sparks.visible = false;
  pivot.add(sparks);
  disposables.push(sparkGeometry, sparkMaterial);

  // Frame the model: fit its height with a little headroom.
  const fit = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const halfFov = (camera.fov * Math.PI) / 360;
    const distH = 0.56 / Math.tan(halfFov);
    const distW = (radius * 1.6) / (Math.tan(halfFov) * camera.aspect);
    camera.position.set(0, 0.02, Math.max(distH, distW) + radius);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  };
  fit();

  let visible = false;
  let frame = 0;
  let revealStart = -1;
  let glitchUntil = 0;
  let nextGlitch = 2500 + Math.random() * 4000;
  const pointer = { x: 0, y: 0 };
  const start = performance.now();

  const render = () => renderer.render(scene, camera);

  const tick = (now: number) => {
    frame = 0;
    const t = (now - start) / 1000;
    uniforms.uTime.value = t;

    if (revealStart >= 0) {
      const p = Math.min(1, (now - revealStart) / HOLO.revealMs);
      const r = easeInOut(p);
      uniforms.uReveal.value = r;
      sparkUniforms.uEdgeY.value = r * 1.1 - 0.55;
      sparkUniforms.uOpacity.value = Math.sin(Math.PI * p);
      sparks.visible = p < 1;
      if (p >= 1) revealStart = -1;
    }

    // Flicker: mostly steady, with rare short dips. Glitch: a 120 ms burst every few seconds.
    const dip = Math.sin(t * 61) * Math.sin(t * 17.3) > 0.96 ? 0.82 : 1;
    uniforms.uFlicker.value = (0.96 + 0.04 * Math.sin(t * 9.1)) * dip;
    if (!opts.lite && now - start > nextGlitch) {
      glitchUntil = now + 120;
      nextGlitch = now - start + 3500 + Math.random() * 5000;
    }
    uniforms.uGlitch.value = now < glitchUntil ? 1 : 0;

    const targetY = Math.sin(t * 0.25) * HOLO.swayRadians + pointer.x * HOLO.parallaxRadians;
    pivot.rotation.y += (targetY - pivot.rotation.y) * 0.05;
    pivot.rotation.x += (pointer.y * 0.05 - pivot.rotation.x) * 0.05;

    render();
    if (visible) frame = requestAnimationFrame(tick);
  };

  const onPointer = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
    pointer.y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
  };
  const onLeave = () => Object.assign(pointer, { x: 0, y: 0 });

  const resizeObserver = new ResizeObserver(() => {
    fit();
    if (!animated) render();
  });
  resizeObserver.observe(canvas);

  if (animated) {
    canvas.addEventListener('pointermove', onPointer);
    canvas.addEventListener('pointerleave', onLeave);
  } else {
    render();
  }

  return {
    reveal() {
      if (animated && uniforms.uReveal.value === 0 && revealStart < 0) revealStart = performance.now();
    },
    setVisible(v) {
      visible = v;
      if (animated && v && !frame) frame = requestAnimationFrame(tick);
    },
    dispose() {
      visible = false;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      canvas.removeEventListener('pointermove', onPointer);
      canvas.removeEventListener('pointerleave', onLeave);
      for (const d of disposables) d.dispose();
      renderer.forceContextLoss();
    },
  };
}
