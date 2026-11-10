// Request limits for the Pages Functions, kept in the D1 table `hits` (schema in db/schema.sql): one row per hashed
// client, endpoint and hour. The Origin check only stops browsers; this caps scripts that fake the header. Keys are
// stored hashed, never raw.
export type D1 = {
  prepare(sql: string): { bind(...v: (string | number)[]): { run(): Promise<unknown>; first<T>(): Promise<T | null> } };
};

const HOUR_MS = 3_600_000;

const hash = async (s: string) =>
  [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))]
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

// The client an hourly budget belongs to. An IPv6 host usually holds a whole /64 and can rotate addresses inside it,
// so the /64 prefix counts as one client. IPv4 (and IPv4-mapped IPv6) counts per address.
export function clientKey(request: Request): string {
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  if (!ip.includes(':')) return ip;
  if (ip.includes('.')) return ip.slice(ip.lastIndexOf(':') + 1);
  const [head, tail] = ip.split('::');
  const h = head ? head.split(':') : [];
  const t = tail ? tail.split(':') : [];
  const groups = tail === undefined ? h : [...h, ...Array(8 - h.length - t.length).fill('0'), ...t];
  return `${groups.slice(0, 4).map((g) => parseInt(g, 16).toString(16)).join(':')}::/64`;
}

// True when `key` has already made `max` requests to `bucket` in the current hour. Counts the request either way.
export async function overLimit(db: D1, key: string, bucket: string, max: number): Promise<boolean> {
  const hour = Math.floor(Date.now() / HOUR_MS);
  const row = await db
    .prepare('INSERT INTO hits (ip, bucket, hour, n) VALUES (?, ?, ?, 1) ON CONFLICT (ip, bucket, hour) DO UPDATE SET n = n + 1 RETURNING n')
    .bind(await hash(key), bucket, hour)
    .first<{ n: number }>();
  // Drop old hours now and then so the table stays small.
  if (Math.random() < 0.02) await db.prepare('DELETE FROM hits WHERE hour < ?').bind(hour - 1).run();
  return (row?.n ?? 0) > max;
}
