// Renders the app to static HTML per locale, plus 404.html and sitemap.xml.
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';

const dist = new URL('../dist/', import.meta.url);
const ssr = new URL('../dist-ssr/', import.meta.url);
const SITE = 'https://ernesto2604.github.io/';

const { render, buildHead, messagesFor } = await import(new URL('entry-server.js', ssr).href);
const template = await readFile(new URL('index.html', dist), 'utf8');
const boot = (await readFile(new URL('boot.js', dist), 'utf8')).replace(/^\/\/.*\n/, '').trim();

const manifest = JSON.parse(await readFile(new URL('.vite/manifest.json', dist), 'utf8'));
// Preload the active locale's message chunk so it is not fetched only after main.js runs.
const localePreload = (locale) => `<link rel="modulepreload" href="/${manifest[`src/content/${locale}.json`].file}">`;

const page = (locale, head, body) =>
  template
    .replace('<html lang="en"', `<html lang="${locale}"`)
    .replace('<!--head-->', head)
    .replace('<script src="/boot.js"></script>', `<script>${boot}</script>`)
    .replace('<!--app-->', body);

for (const locale of ['en', 'es']) {
  const dir = locale === 'en' ? dist : new URL('es/', dist);
  await mkdir(dir, { recursive: true });
  await writeFile(new URL('index.html', dir), page(locale, `${buildHead(locale)}
    ${localePreload(locale)}`, render(locale)));
}

// 404: static, bilingual, no app bundle.
const nf = (l) => messagesFor(l).notFound;
const notFoundBody = ['en', 'es']
  .map(
    (l) => `<section lang="${l}" class="mx-auto max-w-xl px-6 py-16">
      <p class="eyebrow">${nf(l).status}</p>
      <h1 class="mt-4 font-display text-4xl font-light">${nf(l).title}</h1>
      <p class="mt-4 text-muted">${nf(l).body}</p>
      <p class="mt-8"><a class="text-accent underline underline-offset-4" href="${l === 'en' ? '/' : '/es/'}">${nf(l).home}</a></p>
    </section>`,
  )
  .join('\n');
const notFound = page('en', `<title>404 · Ernesto Contreras</title>\n    <meta name="robots" content="noindex">`, `<main id="main" class="min-h-dvh grid content-center">${notFoundBody}</main>`)
  .replace(/<script type="module"[^>]*><\/script>/, '')
  .replace(/<link rel="modulepreload"[^>]*>/g, '');
await writeFile(new URL('404.html', dist), notFound);

const now = new Date().toISOString().slice(0, 10);
const alternates = `<xhtml:link rel="alternate" hreflang="en" href="${SITE}"/><xhtml:link rel="alternate" hreflang="es" href="${SITE}es/"/><xhtml:link rel="alternate" hreflang="x-default" href="${SITE}"/>`;
await writeFile(
  new URL('sitemap.xml', dist),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url><loc>${SITE}</loc><lastmod>${now}</lastmod>${alternates}</url>
  <url><loc>${SITE}es/</loc><lastmod>${now}</lastmod>${alternates}</url>
</urlset>
`,
);

await rm(new URL('boot.js', dist));
await rm(new URL('.vite/', dist), { recursive: true, force: true });
await rm(ssr, { recursive: true, force: true });
console.log('[prerender] wrote index.html, es/index.html, 404.html, sitemap.xml');
