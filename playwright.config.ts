import { defineConfig, devices } from '@playwright/test';

// E2E_PORT lets the suite run against a second preview server when 4173 is taken.
const port = process.env.E2E_PORT ?? '4173';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: `http://localhost:${port}` },
  webServer: { command: `npx vite preview --port ${port} --strictPort`, url: `http://localhost:${port}`, reuseExistingServer: true },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
