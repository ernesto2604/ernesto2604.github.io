import { describe, expect, it } from 'vitest';
import { matchIntent } from '../../src/agent/match';
import { planTools } from '../../src/agent/tools';

const cases: [string, string][] = [
  // English
  ['who is ernesto', 'who'],
  ['tell me about yourself', 'who'],
  ['what has he built?', 'projects'],
  ['show me your projects', 'projects'],
  ['tell me about the ring project', 'ring'],
  ['what is ring telemetryops', 'ring'],
  ['how does the hybrid rag work', 'rag'],
  ['the flutter app', 'wakemap'],
  ['wakemap', 'wakemap'],
  ['other projects', 'others'],
  ['yolo surveillance', 'others'],
  ["what's your stack", 'stack'],
  ['whats your stak', 'stack'],
  ['which programming languages do you use', 'stack'],
  ['work experience', 'experience'],
  ['where did you study', 'education'],
  ['is he available', 'availability'],
  ['open to relocation?', 'availability'],
  ['where is he based', 'location'],
  ['how can I contact him', 'contact'],
  ['email', 'contact'],
  ['can I download the cv', 'cv'],
  ['how does this agent work', 'agent'],
  ['is this a real llm?', 'agent'],
  ['hello', 'greeting'],
  ['thanks!', 'thanks'],
  ['in spanish please', 'lang.es'],
  // Spanish
  ['quién es ernesto', 'who'],
  ['qué proyectos tiene', 'projects'],
  ['háblame del proyecto de ring', 'ring'],
  ['cómo funciona el rag híbrido', 'rag'],
  ['qué tecnologías usa', 'stack'],
  ['experiencia laboral', 'experience'],
  ['dónde estudió', 'education'],
  ['está disponible', 'availability'],
  ['dónde vive', 'location'],
  ['cómo le contacto', 'contact'],
  ['descargar currículum', 'cv'],
  ['cómo funciona este agente', 'agent'],
  ['hola', 'greeting'],
  ['gracias', 'thanks'],
  ['en inglés por favor', 'lang.en'],
  // Typos
  ['telemtry', 'ring'],
  ['experiance', 'experience'],
  ['contcat', 'contact'],
];

describe('matchIntent', () => {
  it.each(cases)('%s → %s', (query, expected) => {
    expect(matchIntent(query).intent?.id).toBe(expected);
  });

  it.each(['', '   ', 'asdfgh qwerty', 'what is the weather in paris', 'the and of', '¿?¡!'])('falls back for %j', (query) => {
    const m = matchIntent(query);
    expect(m.intent).toBeNull();
    expect(m.suggestions.en.length).toBeGreaterThan(0);
    expect(m.suggestions.es.length).toBeGreaterThan(0);
  });

  it('handles very long input', () => {
    expect(() => matchIntent('tell me about ring '.repeat(100))).not.toThrow();
    expect(matchIntent('x'.repeat(5000)).intent).toBeNull();
  });
});

describe('planTools', () => {
  it('always starts with match_intent and reports its real score', () => {
    const m = matchIntent('tell me about the ring project');
    const calls = planTools(m, 'tell me about the ring project');
    expect(calls[0].name).toBe('match_intent');
    expect(calls[0].result).toContain('ring');
  });

  it('reads the real repository data for a project intent', () => {
    const m = matchIntent('ring telemetryops');
    const read = planTools(m, 'ring telemetryops').find((c) => c.name === 'read_repo');
    expect(read?.args.repo).toBe('ring-telemetryops');
    expect(read?.result).toMatch(/Python \d+%/);
  });

  it('searches projects with the site scorer and returns real hit ids', () => {
    const m = matchIntent('what has he built?');
    const s = planTools(m, 'what has he built?').find((c) => c.name === 'search_projects');
    expect(s?.result).toContain('ring-telemetryops');
  });

  it('reads the diagram spec when showing an architecture', () => {
    const m = matchIntent('how does the hybrid rag work');
    const d = planTools(m, 'how does the hybrid rag work').find((c) => c.name === 'show_architecture');
    expect(d?.result).toMatch(/11 components/);
  });

  it('only runs match_intent for a fallback', () => {
    const m = matchIntent('asdfgh');
    expect(planTools(m, 'asdfgh').map((c) => c.name)).toEqual(['match_intent']);
  });

  it('gives every call a plausible duration', () => {
    const m = matchIntent('ring');
    for (const c of planTools(m, 'ring')) {
      expect(c.ms).toBeGreaterThanOrEqual(200);
      expect(c.ms).toBeLessThanOrEqual(900);
    }
  });
});
