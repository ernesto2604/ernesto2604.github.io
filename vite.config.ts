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
  define: { __BUILD_YEAR__: JSON.stringify(new Date().getFullYear()) },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
