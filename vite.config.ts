/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { welcomeMarkup } from './src/lib/welcome';

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    // Dev only: the build writes the welcome overlay in scripts/prerender.mjs.
    {
      name: 'welcome-overlay-dev',
      apply: 'serve',
      transformIndexHtml: (html, ctx) => html.replace('<!--welcome-->', welcomeMarkup(ctx.originalUrl?.startsWith('/es') ? 'es' : 'en')),
    },
  ],
  build: { manifest: true },
  define: { __BUILD_YEAR__: JSON.stringify(new Date().getFullYear()) },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
