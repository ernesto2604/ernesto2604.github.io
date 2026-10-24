import { describe, expect, it } from 'vitest';
import en from '../../src/content/en.json';
import es from '../../src/content/es.json';
import { hasTechIcon } from '../../src/components/TechIcon';

describe('stack', () => {
  it.each([['en', en], ['es', es]] as const)('every %s item has an icon that resolves', (_, messages) => {
    const missing = messages.stack.groups.flatMap((g) => g.items).filter((it) => !hasTechIcon(it.icon));
    expect(missing).toEqual([]);
  });

  it('lists the same icons in both languages', () => {
    const ids = (m: typeof en) => m.stack.groups.map((g) => g.items.map((it) => it.icon));
    expect(ids(es)).toEqual(ids(en));
  });
});
