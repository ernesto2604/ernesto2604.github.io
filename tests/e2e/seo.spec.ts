import { expect, test } from '@playwright/test';

test('English document is served at /', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page).toHaveTitle(/AI Engineer & Forward Deployed Engineer/);
});

test('Spanish document is served at /es/', async ({ page }) => {
  await page.goto('/es/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page).toHaveTitle(/AI Engineer y Forward Deployed Engineer/);
});

test('stored Spanish preference redirects / once and keeps the hash', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('locale', 'es'));
  await page.goto('/#retrieval');
  await expect(page).toHaveURL(/\/es\/#retrieval$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
});

test('unknown paths get the bilingual 404 page', async ({ request }) => {
  const res = await request.get('/404.html');
  const html = await res.text();
  expect(html).toContain('noindex');
  expect(html).toContain('Page not found');
  expect(html).toContain('Página no encontrada');
});
