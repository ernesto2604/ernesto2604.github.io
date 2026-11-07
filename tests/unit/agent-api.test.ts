import { afterEach, describe, expect, it, vi } from 'vitest';
import { onRequestOptions, onRequestPost } from '../../functions/api/agent';
import { buildFacts, systemPrompt } from '../../src/agent/context';

const env = { GROQ_API_KEY: 'test-key' };
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
  it('returns 503 without a key, so the browser falls back', async () => {
    expect((await onRequestPost({ request: post({ question: 'hi' }), env: {} })).status).toBe(503);
  });

  it('rejects other origins and empty questions', async () => {
    expect((await onRequestPost({ request: post({ question: 'hi' }, { origin: 'https://evil.example' }), env })).status).toBe(403);
    expect((await onRequestPost({ request: post({ question: '   ' }), env })).status).toBe(400);
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
