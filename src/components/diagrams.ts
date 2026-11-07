// Diagram layouts (viewBox 720 x 420, 4px grid, orthogonal connectors). ring-telemetryops is a flowchart; the others are architecture diagrams. Labels live in the locale files under cases.<slug>.nodes / .edges.
// `s` is the reveal step: nodes appear in step order and each edge draws after its source node.

export const NODE_H = 56;
const CHAR_W = 8.2; // approx. Geist at 15px

// Greedy word wrap by character budget; callers keep at most two lines (tests/unit/diagrams.test.ts).
export function wrap(label: string, width: number): string[] {
  const max = Math.floor((width - 24) / CHAR_W);
  const lines: string[] = [];
  for (const word of label.split(' ')) {
    const last = lines.at(-1);
    if (last !== undefined && `${last} ${word}`.length <= max) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines;
}

export type DiagramNode = { id: string; x: number; y: number; w: number; h?: number; s: number; tone?: 'key' | 'model' };
// "x,y x,y ..." polyline of axis-aligned points -> path with r=8 rounded corners.
export function route(pts: string, r = 8): string {
  const p = pts.split(' ').map((q) => q.split(',').map(Number));
  let d = `M ${p[0][0]} ${p[0][1]}`;
  for (let i = 1; i < p.length - 1; i++) {
    const [px, py] = p[i - 1], [x, y] = p[i], [nx, ny] = p[i + 1];
    const a = Math.min(r, Math.hypot(x - px, y - py) / 2, Math.hypot(nx - x, ny - y) / 2);
    const [ux, uy, vx, vy] = [Math.sign(x - px), Math.sign(y - py), Math.sign(nx - x), Math.sign(ny - y)];
    d += ` L ${x - ux * a} ${y - uy * a} Q ${x} ${y} ${x + vx * a} ${y + vy * a}`;
  }
  return `${d} L ${p.at(-1)![0]} ${p.at(-1)![1]}`;
}

export type DiagramEdge = { d: string; s: number; label?: string; lx?: number; ly?: number; dashed?: boolean };
export type DiagramSpec = { nodes: DiagramNode[]; edges: DiagramEdge[] };

export const DIAGRAMS: Record<string, DiagramSpec> = {
  'ring-telemetryops': {
    nodes: [
      { id: 'stream', x: 20, y: 32, w: 188, s: 0 },
      { id: 'metrics', x: 252, y: 32, w: 168, s: 1 },
      { id: 'precheck', x: 472, y: 32, w: 228, s: 2, tone: 'key' },
      { id: 'healthy', x: 472, y: 140, w: 228, s: 3 },
      { id: 'kb', x: 252, y: 140, w: 168, s: 3 },
      { id: 'llm', x: 252, y: 252, w: 168, s: 4, tone: 'model' },
      { id: 'contract', x: 472, y: 252, w: 228, s: 5 },
      { id: 'fallback', x: 252, y: 360, w: 168, s: 5 },
      { id: 'report', x: 472, y: 360, w: 228, s: 6, tone: 'key' },
    ],
    edges: [
      { d: route('208,60 252,60'), s: 0.4 },
      { d: route('420,60 472,60'), s: 1.4 },
      { d: route('624,88 624,140'), s: 2.4, label: 'nominal', lx: 636, ly: 118 },
      { d: route('548,88 548,116 336,116 336,140'), s: 2.4, label: 'anomaly', lx: 420, ly: 108 },
      { d: route('114,88 114,280 252,280'), s: 0.6, label: 'keyframe', lx: 126, ly: 190, dashed: true },
      { d: route('336,196 336,252'), s: 3.4 },
      { d: route('420,280 472,280'), s: 4.4 },
      { d: route('336,308 336,360'), s: 4.4, label: 'unavailable', lx: 348, ly: 338, dashed: true },
      { d: route('586,308 586,360'), s: 5.4 },
      { d: route('420,388 472,388'), s: 5.4 },
    ],
  },
  'hybrid-rag-api': {
    nodes: [
      { id: 'pdf', x: 20, y: 32, w: 120, s: 0 },
      { id: 'chunk', x: 160, y: 32, w: 188, s: 1 },
      { id: 'embed', x: 372, y: 32, w: 172, s: 2 },
      { id: 'pg', x: 564, y: 32, w: 136, s: 3, tone: 'key' },
      { id: 'question', x: 20, y: 172, w: 148, s: 4 },
      { id: 'dense', x: 360, y: 140, w: 152, s: 5 },
      { id: 'lexical', x: 360, y: 204, w: 152, s: 5 },
      { id: 'rrf', x: 552, y: 172, w: 148, s: 6, tone: 'key' },
      { id: 'context', x: 20, y: 320, w: 180, s: 7 },
      { id: 'llm', x: 240, y: 320, w: 168, s: 8, tone: 'model' },
      { id: 'answer', x: 448, y: 320, w: 252, s: 9, tone: 'key' },
    ],
    edges: [
      { d: route('140,60 160,60'), s: 0.4, label: 'ingest', lx: 20, ly: 108 },
      { d: route('348,60 372,60'), s: 1.4 },
      { d: route('544,60 564,60'), s: 2.4 },
      { d: route('632,88 632,116 436,116 436,140'), s: 3.4, dashed: true },
      { d: route('168,188 264,188 264,168 360,168'), s: 4.4, label: 'query', lx: 20, ly: 252 },
      { d: route('168,212 264,212 264,232 360,232'), s: 4.4 },
      { d: route('512,168 532,168 532,192 552,192'), s: 5.4 },
      { d: route('512,232 532,232 532,208 552,208'), s: 5.4 },
      { d: route('626,228 626,290 110,290 110,320'), s: 6.4 },
      { d: route('200,348 240,348'), s: 7.4 },
      { d: route('408,348 448,348'), s: 8.4 },
    ],
  },
  wakemap: {
    nodes: [
      { id: 'app', x: 260, y: 20, w: 180, s: 0, tone: 'key' },
      { id: 'commuter', x: 20, y: 120, w: 200, s: 1 },
      { id: 'voice', x: 260, y: 120, w: 180, s: 2 },
      { id: 'traveller', x: 500, y: 120, w: 200, s: 1 },
      { id: 'notify', x: 20, y: 232, w: 200, s: 2 },
      { id: 'proxy', x: 260, y: 232, w: 180, s: 3, tone: 'key' },
      { id: 'maps', x: 500, y: 232, w: 200, s: 2 },
      { id: 'llm', x: 260, y: 340, w: 180, s: 4, tone: 'model' },
      { id: 'json', x: 500, y: 340, w: 200, s: 5 },
    ],
    edges: [
      { d: route('320,76 320,98 120,98 120,120'), s: 0.4 },
      { d: route('380,76 380,98 600,98 600,120'), s: 0.4 },
      { d: route('220,148 260,148'), s: 1.4 },
      { d: route('120,176 120,232'), s: 1.4 },
      { d: route('600,176 600,232'), s: 1.4 },
      { d: route('350,176 350,232'), s: 2.4 },
      { d: route('500,148 470,148 470,260 440,260'), s: 1.4 },
      { d: route('350,288 350,340'), s: 3.4 },
      { d: route('440,368 500,368'), s: 4.4 },
      { d: route('600,340 600,288'), s: 5.4 },
    ],
  },
};
