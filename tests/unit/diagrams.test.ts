import { describe, expect, it } from 'vitest';
import en from '../../src/content/en.json';
import es from '../../src/content/es.json';
import { DIAGRAMS, wrap } from '../../src/components/diagrams';

describe('diagram labels', () => {
  for (const [locale, messages] of Object.entries({ en, es })) {
    for (const [slug, spec] of Object.entries(DIAGRAMS)) {
      it(`${locale} ${slug}: every node label fits in two lines`, () => {
        const nodes = (messages.cases as Record<string, { nodes: Record<string, string> }>)[slug].nodes;
        const overflowing = spec.nodes.filter((n) => wrap(nodes[n.id], n.w).length > 2).map((n) => `${n.id}: ${nodes[n.id]}`);
        expect(overflowing).toEqual([]);
      });
    }
  }
});
