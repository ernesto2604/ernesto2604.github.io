import { useEffect, useRef } from 'react';

// Light to dark on the way into the stack: an ink fog with a noisy edge rises from the bottom of the window as
// #skills scrolls in, and the page tokens flip to the dark set (html[data-dark], tokens.css) halfway through.
// Scrubbed by scroll, drawn only when the progress changes. Without WebGL the canvas fades in as flat ink.
//
// The masthead's tint (.masthead-fog in Masthead.tsx) is drawn by the same shader in strip mode: paper where
// there is no fog, ink where there is, pixel for pixel, fading down as the CSS tint did. A flat tint over an
// uneven fog always left a visible step; this one cannot differ from what is behind it.

const VERT = `attribute vec2 p; varying vec2 vUv; void main(){ vUv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;
const FRAG = `precision mediump float;
uniform float uP; uniform vec2 uRes; uniform vec3 uInk; uniform vec3 uPaper; uniform float uStrip; uniform float uSpan;
varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), u.x), u.y); }
float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.; a *= .5; } return v; }
void main(){
  float t = 1. - vUv.y;                                 // 0 at the top of this canvas
  vec2 w = vec2(vUv.x, 1. - t * uSpan);                 // window coordinates (the strip is the top uSpan of it)
  vec2 q = vec2(w.x * uRes.x / uRes.y, w.y) * 1.6 + vec2(0., uP * 1.2);
  float field = (1. - w.y) + (fbm(q) - .5) * .9;        // highest at the bottom, broken up by the noise
  float edge = mix(1.9, -.9, uP);                       // sweeps from below the window to above it
  float a = smoothstep(edge - .35, edge + .15, field);
  if (uStrip < .5) { gl_FragColor = vec4(uInk * a, a); return; } // premultiplied alpha
  // Strip: the colour behind, solid at the top, 60% at 60% down, clear at the bottom (the old CSS tint).
  float m = t < .35 ? 1. : t < .6 ? mix(1., .6, (t - .35) / .25) : mix(.6, 0., (t - .6) / .4);
  gl_FragColor = vec4(mix(uPaper, uInk, a) * m, m);
}`;

const rgb = (hex: number) => [(hex >> 16) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
const INK = rgb(0x14120f); // --text in the light set, the dark ground
const PAPER = rgb(0xf6f4ef); // --paper
const SCALE = 0.5; // the fog is soft: half resolution is enough

// Sets up the shader on one canvas; null without WebGL.
function layer(canvas: HTMLCanvasElement, strip: boolean) {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false });
  if (!gl) return null;
  const shader = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); // one big triangle
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const u = (name: string) => gl.getUniformLocation(prog, name);
  gl.uniform3fv(u('uInk'), INK);
  gl.uniform3fv(u('uPaper'), PAPER);
  gl.uniform1f(u('uStrip'), strip ? 1 : 0);
  const [uP, uRes, uSpan] = [u('uP'), u('uRes'), u('uSpan')];
  return (p: number) => {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, innerWidth, innerHeight);
    gl.uniform1f(uSpan, strip ? canvas.clientHeight / innerHeight : 1);
    gl.uniform1f(uP, p);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
}

export default function DarkFog() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const strip = document.querySelector<HTMLCanvasElement>('.masthead-fog');
    const target = document.getElementById('skills');
    if (!target) return;
    const html = document.documentElement;

    let draw = layer(canvas, false);
    if (!draw) {
      canvas.style.background = 'rgb(20 18 15)';
      draw = (p) => (canvas.style.opacity = String(p));
    }
    const drawStrip = strip && layer(strip, true);
    if (drawStrip) html.setAttribute('data-fog-strip', ''); // hides the CSS tint the strip replaces

    let last = -1;
    let frame = 0;
    const update = (force = false) => {
      frame = 0;
      // 0 when #skills reaches the bottom of the window, 1 when its top is a quarter of the way down.
      const vh = innerHeight;
      const p = Math.min(1, Math.max(0, (vh - target.getBoundingClientRect().top) / (vh * 0.75)));
      if (!force && p === last) return;
      last = p;
      canvas.style.visibility = p > 0 ? 'visible' : 'hidden';
      html.toggleAttribute('data-dark', p >= 0.5);
      // How much of the masthead strip the fog covers (the shader's alpha near the top, noise left out): the clock,
      // the menu button and the CSS fallback tint blend on it.
      const edge = 1.9 - 2.8 * p;
      const x = Math.min(1, Math.max(0, (0.05 - (edge - 0.35)) / 0.5));
      html.style.setProperty('--fog-top', (x * x * (3 - 2 * x)).toFixed(3));
      if (p > 0) draw(p);
      drawStrip?.(p);
    };
    const resize = () => {
      canvas.width = Math.ceil(innerWidth * SCALE);
      canvas.height = Math.ceil(innerHeight * SCALE);
      if (strip) {
        strip.width = Math.ceil(strip.clientWidth * SCALE);
        strip.height = Math.ceil(strip.clientHeight * SCALE);
      }
      update(true);
    };
    const onScroll = () => (frame ||= requestAnimationFrame(() => update()));

    resize();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', resize);
      html.removeAttribute('data-dark');
      html.removeAttribute('data-fog-strip');
      html.style.removeProperty('--fog-top');
    };
  }, []);

  return <canvas ref={ref} className="dark-fog" />;
}
