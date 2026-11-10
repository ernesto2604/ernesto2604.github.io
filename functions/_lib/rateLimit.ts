// Per-IP request limit for the Pages Functions, kept in the D1 table `hits` (one row per hashed IP, endpoint and hour).
// The Origin check only stops browsers; this caps scripts that fake the header. The IP is stored hashed, never raw.
export type D1 = {
  prepare(sql: string): { bind(...v: (string | number)[]): { run(): Promise<unknown>; first<T>(): Promise<T | null> } };
};

const HOUR_MS = 3_600_000;

const hash = async (s: string) =>
  [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))]
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

// True when this IP has already made `max` requests to `bucket` in the current hour. Counts the request either way.
export async function overLimit(db: D1, request: Request, bucket: string, max: number): Promise<boolean> {
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const hour = Math.floor(Date.now() / HOUR_MS);
  const row = await db
    .prepare('INSERT INTO hits (ip, bucket, hour, n) VALUES (?, ?, ?, 1) ON CONFLICT (ip, bucket, hour) DO UPDATE SET n = n + 1 RETURNING n')
    .bind(await hash(ip), bucket, hour)
    .first<{ n: number }>();
  // Drop old hours now and then so the table stays small.
  if (Math.random() < 0.02) await db.prepare('DELETE FROM hits WHERE hour < ?').bind(hour - 1).run();
  return (row?.n ?? 0) > max;
}
