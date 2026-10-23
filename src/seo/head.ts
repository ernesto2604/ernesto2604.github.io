import profile from '../content/profile.json';
import { messagesFor, type Locale } from '../i18n';
import { translate } from '../i18n/translate';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const urlFor = (locale: Locale) => profile.siteUrl + (locale === 'es' ? 'es/' : '');
const OG_LOCALE: Record<Locale, string> = { en: 'en_US', es: 'es_ES' };

export function buildHead(locale: Locale): string {
  const t = (key: string) => translate(messagesFor(locale), key);
  const other: Locale = locale === 'en' ? 'es' : 'en';
  const title = esc(t('meta.title'));
  const description = esc(t('meta.description'));
  const url = urlFor(locale);
  const image = `${profile.siteUrl}og-${locale}.png`;

  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: t('hero.role'),
    url,
    email: `mailto:${profile.email}`,
    address: { '@type': 'PostalAddress', addressLocality: profile.location.city, addressCountry: profile.location.country },
    sameAs: [profile.github, profile.linkedin],
    knowsLanguage: ['es', 'en'],
  };

  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}">`,
    `<link rel="canonical" href="${url}">`,
    `<link rel="alternate" hreflang="en" href="${urlFor('en')}">`,
    `<link rel="alternate" hreflang="es" href="${urlFor('es')}">`,
    `<link rel="alternate" hreflang="x-default" href="${urlFor('en')}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:image" content="${image}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="${esc(t('meta.ogAlt'))}">`,
    `<meta property="og:locale" content="${OG_LOCALE[locale]}">`,
    `<meta property="og:locale:alternate" content="${OG_LOCALE[other]}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${description}">`,
    `<meta name="twitter:image" content="${image}">`,
    `<script type="application/ld+json">${JSON.stringify(person).replace(/</g, '\\u003c')}</script>`,
  ].join('\n    ');
}
