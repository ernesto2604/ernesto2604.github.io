import { useEffect, useRef } from 'react';

// Light to dark on the way into the stack: an ink fog with a noisy edge rises from the bottom of the window as
// #skills scrolls in, and the page tokens flip to the dark set (html[data-dark], tokens.css) halfway through.
// Scrubbed by scroll, drawn only when the progress changes. Without WebGL the canvas fades in as flat ink.

const VERT = `attribute vec2 p; varying vec2 vUv; void main(){ vUv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;
const FRAG = `precision mediump float;
uniform float uP; uniform vec2 uRes; uniform vec3 uInk; varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), u.x), u.y); }
float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.; a *= .5; } return v; }
void main(){
  vec2 q = vec2(vUv.x * uRes.x / uRes.y, vUv.y) * 1.6 + vec2(0., uP * 1.2);
  float field = (1. - vUv.y) + (fbm(q) - .5) * .9;   // highest at the bottom, broken up by the noise
  float edge = mix(1.9, -.9, uP);                       // sweeps from below the window to above it
  float a = smoothstep(edge - .35, edge + .15, field);
  gl_FragColor = vec4(uInk * a, a);                     // premultiplied alpha
}`;

const INK = [0x14 / 255, 0x12 / 255, 0x0f / 255]; // --text in the light set, the dark ground
const SCALE = 0.5; // the fog is soft: half resolution is enough

export default function DarkFog() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const target = document.getElementById('skills');
    if (!target) return;
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false });
    let draw: (p: number) => void;

    if (gl) {
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
      gl.uniform3fv(gl.getUniformLocation(prog, 'uInk'), INK);
      const uP = gl.getUniformLocation(prog, 'uP');
      const uRes = gl.getUniformLocation(prog, 'uRes');
      draw = (p) => {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform1f(uP, p);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      };
    } else {
      canvas.style.background = 'rgb(20 18 15)';
      draw = (p) => (canvas.style.opacity = String(p));
    }

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
      const html = document.documentElement;
      html.toggleAttribute('data-dark', p >= 0.5);
      // How much of the masthead strip the fog covers: the shader's alpha near the top, noise left out.
      const edge = 1.9 - 2.8 * p;
      const x = Math.min(1, Math.max(0, (0.05 - (edge - 0.35)) / 0.5));
      html.style.setProperty('--fog-top', (x * x * (3 - 2 * x)).toFixed(3));
      if (p > 0) draw(p);
    };
    const resize = () => {
      canvas.width = Math.ceil(innerWidth * SCALE);
      canvas.height = Math.ceil(innerHeight * SCALE);
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
      document.documentElement.removeAttribute('data-dark');
      document.documentElement.style.removeProperty('--fog-top');
    };
  }, []);

  return <canvas ref={ref} className="dark-fog" />;
}
