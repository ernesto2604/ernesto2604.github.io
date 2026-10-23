import { expect, test } from '@playwright/test';

test('deep link to a stage lands on that section after hydration', async ({ page }) => {
  await page.goto('/es/#retrieval');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await expect(page.locator('#retrieval')).toBeInViewport();
});

test('language toggle keeps the hash and stores the choice', async ({ page }) => {
  await page.goto('/#rerank');
  await page.getByRole('link', { name: 'Leer en español' }).click();
  await expect(page).toHaveURL(/\/es\/#rerank$/);
  expect(await page.evaluate(() => localStorage.getItem('locale'))).toBe('es');
  await page.getByRole('link', { name: 'Read in English' }).click();
  await expect(page).toHaveURL(/localhost:4173\/#rerank$/);
});

test('first Tab press reaches the skip link', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium');
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
});

test('pipeline indicator marks the stage in view', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'indicator hidden in the hero on mobile; covered on desktop');
  await page.goto('/#rerank');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await expect(page.getByRole('navigation', { name: 'Pipeline stages' }).locator('[aria-current="step"]')).toHaveAttribute('href', '#rerank');
});

test('without JavaScript the hero and projects are readable and JS-only buttons hidden', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Ernesto Contreras' })).toBeVisible();
  await expect(page.getByText('Who is Ernesto and what has he built?').first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ring TelemetryOps' })).toBeVisible();
  await expect(page.locator('.story-row').first()).toContainText('1.000');
  await expect(page.getByRole('button', { name: /Ask the agent/ })).toHaveCount(0);
  await context.close();
});

test('keyboard reaches the re-score chips in the pinned story and focus reveals their phase', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'pinned mode is desktop only');
  await page.goto('/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  const chip = page.getByRole('button', { name: 'All terms' });
  await chip.focus();
  await expect(chip).toBeFocused();
  await expect(page.locator('.story-cap-retrieval')).toHaveClass(/is-active/, { timeout: 3000 });
});

test('deep link to the pinned case study opens it expanded, not as a collapsed strip', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'pinned mode is desktop only');
  await page.goto('/es/#ring-telemetryops');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await page.waitForTimeout(800);
  const progress = await page.evaluate(() => Number(getComputedStyle(document.querySelector('.scene')!).getPropertyValue('--sp')));
  expect(progress).toBeGreaterThan(0.4);
});

test('deep link into the story sets the matching phase', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'pinned mode is desktop only');
  await page.goto('/es/#retrieval');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await expect(page.locator('.story')).toHaveAttribute('data-phase', 'retrieval');
});
