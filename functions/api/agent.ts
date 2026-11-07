// Cloudflare Pages Function: POST /api/agent → { answer, model }.
// Answers with a Groq-hosted LLM grounded on the site's own content. Any failure returns a non-2xx status and the
// browser falls back to the local matcher, so the agent keeps working without this function (dev server, rate limits).
// The GitHub Pages mirror calls it cross-origin, so the key stays on Cloudflare.
import { systemPrompt } from '../../src/agent/context';

type Env = { GROQ_API_KEY?: string; GROQ_MODEL?: string };
type Turn = { q: string; a: string };

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// The smaller model has its own free quota, so it takes over when the first one is rate limited or retired.
const MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'];
const MAX_QUESTION = 300;
const MAX_HISTORY = 3;
// Other sites allowed to spend the key's quota, besides this one.
const MIRRORS = ['https://ernesto2604.github.io'];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

const cors = (origin: string) => ({
  'access-control-allow-origin': origin,
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'access-control-max-age': '86400',
  vary: 'origin',
});

// Preflight for the mirror's JSON POST.
export function onRequestOptions({ request }: { request: Request }): Response {
  const origin = request.headers.get('origin') ?? '';
  return MIRRORS.includes(origin) ? new Response(null, { status: 204, headers: cors(origin) }) : new Response(null, { status: 403 });
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  const origin = request.headers.get('origin');
  const mirror = !!origin && MIRRORS.includes(origin);
  // Only this site and its mirror may spend the key's quota.
  if (origin && !mirror && new URL(origin).host !== new URL(request.url).host) return json({ error: 'forbidden' }, 403);
  const res = await answer(request, env);
  if (mirror) for (const [k, v] of Object.entries(cors(origin))) res.headers.set(k, v);
  return res;
}

async function answer(request: Request, env: Env): Promise<Response> {
  if (!env.GROQ_API_KEY) return json({ error: 'not configured' }, 503);

  let body: { question?: unknown; locale?: unknown; history?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad json' }, 400);
  }
  const question = str(body.question, MAX_QUESTION);
  if (!question) return json({ error: 'empty question' }, 400);
  const locale = body.locale === 'es' ? 'es' : 'en';
  const history: Turn[] = (Array.isArray(body.history) ? body.history : [])
    .slice(-MAX_HISTORY)
    .map((t: { q?: unknown; a?: unknown }) => ({ q: str(t?.q, MAX_QUESTION), a: str(t?.a, 800) }))
    .filter((t) => t.q && t.a);

  const messages = [
    { role: 'system', content: systemPrompt(locale) },
    ...history.flatMap((t) => [
      { role: 'user', content: t.q },
      { role: 'assistant', content: t.a },
    ]),
    { role: 'user', content: question },
  ];

  const models = env.GROQ_MODEL ? [env.GROQ_MODEL, ...MODELS.filter((m) => m !== env.GROQ_MODEL)] : MODELS;
  for (const model of models) {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { authorization: `Bearer ${env.GROQ_API_KEY}`, 'content-type': 'application/json' },
      // gpt-oss reasons before answering; low effort keeps it fast and leaves room in max_tokens for the reply.
      body: JSON.stringify({ model, messages, temperature: 0.2, max_tokens: 400, ...(model.startsWith('openai/gpt-oss') ? { reasoning_effort: 'low' } : {}) }),
    }).catch(() => null);
    // Rate limited, retired or failing model: try the next one.
    if (!res?.ok) continue;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    // The panel renders plain text, so drop markdown emphasis the model may still add.
    const answer = data.choices?.[0]?.message?.content?.replace(/\*\*|`|^#+\s*/gm, '').trim();
    if (!answer) continue;
    return json({ answer, model });
  }
  return json({ error: 'unavailable' }, 503);
}
