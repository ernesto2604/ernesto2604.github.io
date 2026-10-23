// Architecture diagram layouts (viewBox 720 x 420). Labels live in the locale files under cases.<slug>.nodes / .edges.
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
export type DiagramEdge = { d: string; s: number; label?: string; lx?: number; ly?: number; dashed?: boolean };
export type DiagramSpec = { nodes: DiagramNode[]; edges: DiagramEdge[] };

export const DIAGRAMS: Record<string, DiagramSpec> = {
  'ring-telemetryops': {
    nodes: [
      { id: 'stream', x: 20, y: 30, w: 190, s: 0 },
      { id: 'metrics', x: 250, y: 30, w: 170, s: 1 },
      { id: 'precheck', x: 470, y: 30, w: 230, s: 2, tone: 'key' },
      { id: 'healthy', x: 470, y: 140, w: 230, s: 3 },
      { id: 'kb', x: 250, y: 140, w: 170, s: 3 },
      { id: 'llm', x: 250, y: 250, w: 170, s: 4, tone: 'model' },
      { id: 'contract', x: 470, y: 250, w: 230, s: 5 },
      { id: 'fallback', x: 250, y: 360, w: 170, s: 5 },
      { id: 'report', x: 470, y: 360, w: 230, s: 6, tone: 'key' },
    ],
    edges: [
      { d: 'M 210 58 H 250', s: 0.4 },
      { d: 'M 420 58 H 470', s: 1.4 },
      { d: 'M 585 86 V 140', s: 2.4, label: 'nominal', lx: 595, ly: 117 },
      { d: 'M 500 86 C 500 116, 335 110, 335 140', s: 2.4, label: 'anomaly', lx: 400, ly: 104 },
      { d: 'M 115 86 V 278 H 250', s: 0.6, label: 'keyframe', lx: 125, ly: 190, dashed: true },
      { d: 'M 335 196 V 250', s: 3.4 },
      { d: 'M 420 278 H 470', s: 4.4 },
      { d: 'M 335 306 V 360', s: 4.4, label: 'unavailable', lx: 345, ly: 337, dashed: true },
      { d: 'M 585 306 V 360', s: 5.4 },
      { d: 'M 420 388 H 470', s: 5.4 },
    ],
  },
  'hybrid-rag-api': {
    nodes: [
      { id: 'pdf', x: 20, y: 30, w: 120, s: 0 },
      { id: 'chunk', x: 160, y: 30, w: 190, s: 1 },
      { id: 'embed', x: 370, y: 30, w: 175, s: 2 },
      { id: 'pg', x: 565, y: 30, w: 135, s: 3, tone: 'key' },
      { id: 'question', x: 20, y: 172, w: 150, s: 4 },
      { id: 'dense', x: 380, y: 140, w: 150, s: 5 },
      { id: 'lexical', x: 380, y: 204, w: 150, s: 5 },
      { id: 'rrf', x: 550, y: 172, w: 150, s: 6, tone: 'key' },
      { id: 'context', x: 20, y: 320, w: 180, s: 7 },
      { id: 'llm', x: 240, y: 320, w: 170, s: 8, tone: 'model' },
      { id: 'answer', x: 450, y: 320, w: 250, s: 9, tone: 'key' },
    ],
    edges: [
      { d: 'M 140 58 H 160', s: 0.4, label: 'ingest', lx: 20, ly: 106 },
      { d: 'M 350 58 H 370', s: 1.4 },
      { d: 'M 545 58 H 565', s: 2.4 },
      { d: 'M 632 86 V 112 H 455 V 140', s: 3.4, dashed: true },
      { d: 'M 170 200 C 270 200, 280 168, 380 168', s: 4.4, label: 'query', lx: 20, ly: 250 },
      { d: 'M 170 200 C 270 200, 280 232, 380 232', s: 4.4 },
      { d: 'M 530 168 C 540 168, 540 200, 550 200', s: 5.4 },
      { d: 'M 530 232 C 540 232, 540 200, 550 200', s: 5.4 },
      { d: 'M 625 228 V 290 H 110 V 320', s: 6.4 },
      { d: 'M 200 348 H 240', s: 7.4 },
      { d: 'M 410 348 H 450', s: 8.4 },
    ],
  },
  wakemap: {
    nodes: [
      { id: 'app', x: 270, y: 20, w: 180, s: 0, tone: 'key' },
      { id: 'commuter', x: 20, y: 120, w: 200, s: 1 },
      { id: 'voice', x: 260, y: 120, w: 180, s: 2 },
      { id: 'traveller', x: 500, y: 120, w: 200, s: 1 },
      { id: 'notify', x: 20, y: 230, w: 200, s: 2 },
      { id: 'proxy', x: 260, y: 230, w: 180, s: 3, tone: 'key' },
      { id: 'maps', x: 500, y: 230, w: 200, s: 2 },
      { id: 'llm', x: 260, y: 340, w: 180, s: 4, tone: 'model' },
      { id: 'json', x: 500, y: 340, w: 200, s: 5 },
    ],
    edges: [
      { d: 'M 300 76 C 300 100, 120 96, 120 120', s: 0.4 },
      { d: 'M 420 76 C 420 100, 600 96, 600 120', s: 0.4 },
      { d: 'M 220 148 H 260', s: 1.4 },
      { d: 'M 120 176 V 230', s: 1.4 },
      { d: 'M 600 176 V 230', s: 1.4 },
      { d: 'M 350 176 V 230', s: 2.4 },
      { d: 'M 500 148 C 455 148, 420 190, 420 230', s: 1.4 },
      { d: 'M 350 286 V 340', s: 3.4 },
      { d: 'M 440 368 H 500', s: 4.4 },
      { d: 'M 600 340 V 286', s: 5.4 },
    ],
  },
};
