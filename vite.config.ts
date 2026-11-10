/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { welcomeMarkup } from './src/lib/welcome';
import { buildHead } from './src/seo/head';

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    // Dev only: the build writes the head and the welcome overlay in scripts/prerender.mjs.
    {
      name: 'head-and-welcome-dev',
      apply: 'serve',
      transformIndexHtml: (html, ctx) => {
        const locale = ctx.originalUrl?.startsWith('/es') ? 'es' : 'en';
        return html.replace('<!--head-->', buildHead(locale)).replace('<!--welcome-->', welcomeMarkup(locale));
      },
    },
  ],
  // The three.js hologram chunk (~640 kB, lazy-loaded) is expected to exceed the default 500 kB warning.
  build: { manifest: true, chunkSizeWarningLimit: 700 },
  // Dev only: Vite does not run functions/, so /api goes to `wrangler pages dev dist --port 8788` (reads .dev.vars).
  // The functions only accept their own origin, so the proxy sends wrangler's.
  server: {
    // Vite's default deny list plus wrangler's secrets (.dev.vars holds GROQ_API_KEY), so `vite --host` never serves them.
    fs: { deny: ['.env', '.env.*', '.dev.vars', '.dev.vars.*', '**/.wrangler/**', '*.{crt,pem,key,p12,pfx,cer,der}', '.npmrc', '.yarnrc.yml', '**/.git/**'] },
    proxy: { '/api': { target: 'http://localhost:8788', changeOrigin: true, headers: { origin: 'http://localhost:8788' } } },
  },
  define: { __BUILD_YEAR__: JSON.stringify(new Date().getFullYear()) },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
