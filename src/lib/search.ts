// Small lexical scorer shared by the Retrieval section and the on-site agent.
// BM25 over weighted fields, with prefix and edit-distance matching for typos.

const STOPWORDS = new Set(
  (
    // English
    'a an and are as at be by can could do does for from had has have he her him his how i in into is it its me my of on or our she so that the their them they this to was we were what when where which who whom why will with would you your about tell show give ' +
    // Spanish
    'a al como con cual cuales cuando de del donde el ella ellos en es esa ese eso esta este esto fue ha han hay la las le les lo los me mi mis muy no nos o para pero por que quien quienes se sea ser si sin sobre su sus te tiene tienen tu tus un una uno unos y ya yo dime cuentame hecho'
  ).split(' '),
);

export type Field = { text: string; weight: number };
export type Doc = { id: string; fields: Field[] };
// score: normalised to the best hit (1 = top). raw: absolute BM25 sum, comparable across queries.
export type Hit = { id: string; score: number; raw: number; matched: string[] };

type IndexedDoc = { id: string; tf: Map<string, number>; length: number };
export type Index = { docs: IndexedDoc[]; df: Map<string, number>; avgLength: number };

export function normalize(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9+#]+/g, ' ').trim();
}

export function tokenize(s: string): string[] {
  return normalize(s)
    .split(' ')
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

// Optimal string alignment distance (Damerau-Levenshtein with adjacent transpositions).
export function editDistance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

// How well query token q matches index term t: exact 1, prefix 0.7, typo 0.5, else 0.
function matchStrength(q: string, t: string): number {
  if (q === t) return 1;
  if (q.length < 4) return 0;
  if (t.startsWith(q)) return 0.7;
  const maxEdits = q.length >= 7 ? 2 : 1;
  if (Math.abs(q.length - t.length) > maxEdits) return 0;
  return editDistance(q, t) <= maxEdits ? 0.5 : 0;
}

export function createIndex(docs: Doc[]): Index {
  const df = new Map<string, number>();
  const indexed = docs.map(({ id, fields }) => {
    const tf = new Map<string, number>();
    let length = 0;
    for (const { text, weight } of fields) {
      for (const token of tokenize(text)) {
        tf.set(token, (tf.get(token) ?? 0) + weight);
        length += weight;
      }
    }
    for (const term of tf.keys()) df.set(term, (df.get(term) ?? 0) + 1);
    return { id, tf, length };
  });
  const avgLength = indexed.reduce((sum, d) => sum + d.length, 0) / Math.max(indexed.length, 1);
  return { docs: indexed, df, avgLength };
}

const K1 = 1.2;
const B = 0.75;

export function search(index: Index, query: string, opts: { limit?: number } = {}): Hit[] {
  const terms = [...new Set(tokenize(query))].slice(0, 32);
  if (!terms.length) return [];
  const n = index.docs.length;

  // Resolve each query token to the vocabulary terms it matches, once.
  const expansions = terms.map((q) =>
    [...index.df.keys()].map((t) => ({ t, s: matchStrength(q, t) })).filter((m) => m.s > 0),
  );

  const hits: Hit[] = [];
  for (const doc of index.docs) {
    let score = 0;
    const matched: string[] = [];
    terms.forEach((q, i) => {
      let best = 0;
      for (const { t, s } of expansions[i]) {
        const tf = doc.tf.get(t);
        if (!tf) continue;
        const df = index.df.get(t)!;
        const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5));
        const bm25 = (idf * tf * (K1 + 1)) / (tf + K1 * (1 - B + (B * doc.length) / index.avgLength));
        best = Math.max(best, s * bm25);
      }
      if (best > 0) {
        score += best;
        matched.push(q);
      }
    });
    if (score > 0) hits.push({ id: doc.id, score, raw: score, matched });
  }

  hits.sort((a, b) => b.score - a.score);
  const top = hits[0]?.score ?? 1;
  return hits.slice(0, opts.limit ?? hits.length).map((h) => ({ ...h, score: Math.round((h.score / top) * 1000) / 1000, raw: Math.round(h.raw * 1000) / 1000 }));
}
