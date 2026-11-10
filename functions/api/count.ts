// Cloudflare Pages Function: POST /api/count with {event, lang} → adds 1 to that row in the D1 table `counts`.
// The browser sends it with navigator.sendBeacon as text/plain, so the GitHub Pages mirror needs no CORS preflight.
// The site column comes from the Origin header, not the body. Read the numbers in the D1 console: SELECT * FROM counts;
import { overLimit, type D1 } from '../_lib/rateLimit';

type Env = { DB?: D1 };

const EVENTS = ['view', 'get'];
const LANGS = ['es', 'en'];
const MIRROR = 'https://ernesto2604.github.io';
const MAX_PER_HOUR = 20;

export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  const origin = request.headers.get('origin');
  const site = origin === MIRROR ? 'github' : origin && new URL(origin).host === new URL(request.url).host ? 'pages' : null;
  if (!site) return new Response(null, { status: 403 });
  if (!env.DB) return new Response(null, { status: 503 });
  const cors = { 'access-control-allow-origin': origin! };

  let body: { event?: unknown; lang?: unknown };
  try {
    body = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 400 });
  }
  const { event, lang } = body;
  if (typeof event !== 'string' || !EVENTS.includes(event) || typeof lang !== 'string' || !LANGS.includes(lang)) {
    return new Response(null, { status: 400 });
  }

  if (await overLimit(env.DB, request, 'count', MAX_PER_HOUR)) return new Response(null, { status: 429, headers: cors });
  await env.DB.prepare('INSERT INTO counts (event, lang, site, n) VALUES (?, ?, ?, 1) ON CONFLICT (event, lang, site) DO UPDATE SET n = n + 1')
    .bind(event, lang, site)
    .run();
  return new Response(null, { status: 204, headers: cors });
}
