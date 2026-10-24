import { describe, expect, it } from 'vitest';
import { buildHead } from '../../src/seo/head';

const ld = (html: string) => JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)![1]);

describe('buildHead', () => {
  it('sets English title, description and canonical on /', () => {
    const html = buildHead('en');
    expect(html).toContain('<title>Ernesto Contreras · AI Engineer &amp; Forward Deployed Engineer</title>');
    expect(html).toMatch(/<meta name="description" content="Ernesto Contreras builds AI systems/);
    expect(html).toContain('<link rel="canonical" href="https://ernesto2604.github.io/">');
  });

  it('sets Spanish canonical and og:locale on /es/', () => {
    const html = buildHead('es');
    expect(html).toContain('<link rel="canonical" href="https://ernesto2604.github.io/es/">');
    expect(html).toContain('<meta property="og:locale" content="es_ES">');
    expect(html).toContain('<meta property="og:locale:alternate" content="en_US">');
  });

  it.each(['en', 'es'] as const)('lists hreflang alternates for %s', (locale) => {
    const html = buildHead(locale);
    expect(html).toContain('<link rel="alternate" hreflang="en" href="https://ernesto2604.github.io/">');
    expect(html).toContain('<link rel="alternate" hreflang="es" href="https://ernesto2604.github.io/es/">');
    expect(html).toContain('<link rel="alternate" hreflang="x-default" href="https://ernesto2604.github.io/">');
  });

  it('points Open Graph and Twitter at the locale image', () => {
    const html = buildHead('es');
    expect(html).toContain('<meta property="og:image" content="https://ernesto2604.github.io/og-es.png">');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
  });

  it('embeds a valid JSON-LD Person', () => {
    const person = ld(buildHead('en'));
    expect(person['@type']).toBe('Person');
    expect(person.name).toBe('Ernesto Contreras');
    expect(person.address.addressLocality).toBe('Madrid');
    expect(person.sameAs).toContain('https://github.com/ernesto2604');
  });

  // The visible hero only says "AI Engineer"; FDE must stay in machine-readable metadata.
  it.each(['en', 'es'] as const)('keeps Forward Deployed Engineer in title and JSON-LD for %s', (locale) => {
    const html = buildHead(locale);
    expect(html).toMatch(/<title>[^<]*Forward Deployed Engineer<\/title>/);
    expect(ld(html).jobTitle).toContain('Forward Deployed Engineer');
  });
});
