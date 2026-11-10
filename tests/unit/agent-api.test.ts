import { afterEach, describe, expect, it, vi } from 'vitest';
import { onRequestOptions, onRequestPost } from '../../functions/api/agent';
import { buildFacts, systemPrompt } from '../../src/agent/context';
import { clientKey } from '../../functions/_lib/rateLimit';

// D1 stand-in for the limiter: counts per (key hash, bucket) like the real upsert; `start` presets a bucket's count.
const fakeDb = (start: Record<string, number> = {}) => {
  const n = new Map<string, number>();
  return {
    prepare: (sql: string) => ({
      bind: (...v: (string | number)[]) => ({
        run: async () => 0,
        first: async <T,>() => {
          const k = `${v[0]}|${v[1]}`;
          n.set(k, (n.get(k) ?? start[String(v[1])] ?? 0) + 1);
          return (sql.includes('RETURNING') ? { n: n.get(k) } : null) as T;
        },
      }),
    }),
  };
};
const env = { GROQ_API_KEY: 'test-key', DB: fakeDb() };
const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('https://ernesto2406.pages.dev/api/agent', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
const groq = (status: number, content = 'He builds RAG systems.') =>
  new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status });

afterEach(() => vi.unstubAllGlobals());

describe('agent context', () => {
  it('grounds the prompt on the site content', () => {
    const facts = buildFacts();
    for (const fact of ['Ernesto Contreras', 'York St John', 'Hybrid RAG API', 'ercoal04@gmail.com', 'CEU']) expect(facts).toContain(fact);
    expect(systemPrompt('es')).toContain('Spanish');
  });
});

describe('POST /api/agent', () => {
  it('returns 503 without a key or without the limiter database, so the browser falls back', async () => {
    const fetchMock = vi.fn().mockResolvedValue(groq(200));
    vi.stubGlobal('fetch', fetchMock);
    expect((await onRequestPost({ request: post({ question: 'hi' }), env: {} })).status).toBe(503);
    expect((await onRequestPost({ request: post({ question: 'hi' }), env: { GROQ_API_KEY: 'test-key' } })).status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects other origins, malformed origins, non-JSON bodies and empty questions', async () => {
    expect((await onRequestPost({ request: post({ question: 'hi' }, { origin: 'https://evil.example' }), env })).status).toBe(403);
    expect((await onRequestPost({ request: post({ question: 'hi' }, { origin: 'null' }), env })).status).toBe(403);
    expect((await onRequestPost({ request: post({ question: 'hi' }, { 'content-type': 'text/plain' }), env })).status).toBe(415);
    expect((await onRequestPost({ request: post({ question: '   ' }), env })).status).toBe(400);
  });

  it('stops past the per-client and the global hourly limits without calling Groq', async () => {
    const fetchMock = vi.fn().mockResolvedValue(groq(200));
    vi.stubGlobal('fetch', fetchMock);
    expect((await onRequestPost({ request: post({ question: 'hi' }), env: { ...env, DB: fakeDb({ agent: 30 }) } })).status).toBe(429);
    expect((await onRequestPost({ request: post({ question: 'hi' }), env: { ...env, DB: fakeDb({ 'agent-all': 300 }) } })).status).toBe(429);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('lets the GitHub Pages mirror call it cross-origin', async () => {
    const mirror = 'https://ernesto2604.github.io';
    const preflight = onRequestOptions({ request: new Request('https://ernesto2406.pages.dev/api/agent', { method: 'OPTIONS', headers: { origin: mirror } }) });
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('access-control-allow-origin')).toBe(mirror);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(groq(200)));
    const res = await onRequestPost({ request: post({ question: 'hi' }, { origin: mirror }), env });
    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBe(mirror);
    expect(onRequestOptions({ request: new Request('https://ernesto2406.pages.dev/api/agent', { method: 'OPTIONS', headers: { origin: 'https://evil.example' } }) }).status).toBe(403);
  });

  it('answers with the grounded prompt, history and question', async () => {
    const fetchMock = vi.fn().mockResolvedValue(groq(200, '**He builds** RAG systems.'));
    vi.stubGlobal('fetch', fetchMock);
    const res = await onRequestPost({ request: post({ question: 'what does he do?', locale: 'en', history: [{ q: 'hi', a: 'hello' }] }), env });
    expect(await res.json()).toEqual({ answer: 'He builds RAG systems.', model: 'openai/gpt-oss-120b' });
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sent.messages[0].content).toContain('FACTS:');
    expect(sent.messages.slice(1).map((m: { content: string }) => m.content)).toEqual(['hi', 'hello', 'what does he do?']);
  });

  it('falls back to the smaller model when rate limited', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(groq(429)).mockResolvedValueOnce(groq(200)));
    const res = await onRequestPost({ request: post({ question: 'stack?' }), env });
    expect((await res.json()).model).toBe('openai/gpt-oss-20b');
  });

  it('returns 503 when every model is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(groq(429)));
    expect((await onRequestPost({ request: post({ question: 'stack?' }), env })).status).toBe(503);
  });
});

describe('clientKey', () => {
  const key = (ip: string) => clientKey(new Request('https://x.test', { headers: { 'cf-connecting-ip': ip } }));
  it('counts an IPv6 /64 as one client and IPv4 per address', () => {
    expect(key('2001:db8:1:2::1')).toBe(key('2001:0db8:0001:0002:ffff:eeee:dddd:cccc'));
    expect(key('2001:db8:1:2::1')).toBe('2001:db8:1:2::/64');
    expect(key('2001:db8:1:3::1')).not.toBe(key('2001:db8:1:2::1'));
    expect(key('::1')).toBe('0:0:0:0::/64');
    expect(key('203.0.113.7')).toBe('203.0.113.7');
    expect(key('::ffff:203.0.113.7')).toBe('203.0.113.7');
  });
});
