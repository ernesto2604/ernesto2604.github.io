import { expect, test } from './fixtures';

test('deep link to a stage lands on that section after hydration', async ({ page }) => {
  await page.goto('/es/#retrieval');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await expect(page.locator('#retrieval')).toBeInViewport();
});

test('language toggle keeps the hash and stores the choice', async ({ page }) => {
  await page.goto('/#retrieval');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('link', { name: /Leer en español/ }).click();
  await expect(page).toHaveURL(/\/es\/#retrieval$/);
  expect(await page.evaluate(() => localStorage.getItem('locale'))).toBe('es');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await page.getByRole('button', { name: 'Abrir menú' }).click();
  await page.getByRole('link', { name: /Read in English/ }).click();
  await expect(page).toHaveURL(/localhost:\d+\/#retrieval$/);
});

test('first Tab press reaches the menu button (no skip link)', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium');
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused();
});



test('without JavaScript the hero and projects are readable and JS-only buttons hidden', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'AI Engineer' })).toBeVisible();
  await expect(page.getByText("Hi, I'm Ernesto.")).toBeVisible();
  // The query now opens Retrieval; its scores below still answer it.
  await expect(page.getByText('Who is Ernesto and what has he built?').first()).toBeVisible();
  // The menu cannot open without JS, so its links render as a plain block.
  await expect(page.locator('#site-menu').getByRole('link', { name: 'Work' })).toBeVisible();
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

test('a project folder opens its case behind a curtain, and Back returns to the page', async ({ page }) => {
  await page.goto('/#generate');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await page.getByRole('button', { name: 'Open Hybrid RAG API' }).click();
  const back = page.getByRole('button', { name: 'Back', exact: true });
  await expect(back).toBeFocused({ timeout: 4000 });
  await expect(page.getByRole('heading', { level: 2, name: 'Hybrid RAG API' })).toBeVisible();
  await back.click();
  await expect(page.locator('.case-dialog')).toBeHidden({ timeout: 4000 });
  await expect(page.getByRole('button', { name: 'Open Hybrid RAG API' })).toBeFocused();
});

test('deep link into the story sets the matching phase', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'pinned mode is desktop only');
  await page.goto('/es/#retrieval');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await expect(page.locator('.story')).toHaveAttribute('data-phase', 'retrieval');
});

test('scrolling into a section seam swaps the next section in at the top', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'section swaps are for the pinned desktop layout');
  await page.goto('/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  const seamTop = () => page.evaluate(() => Math.round(document.getElementById('generate')!.getBoundingClientRect().top));
  await page.evaluate(() => scrollTo(0, document.getElementById('generate')!.getBoundingClientRect().top + scrollY - innerHeight - 40));
  await page.mouse.move(600, 400);
  await page.mouse.wheel(0, 240);
  await expect.poll(seamTop, { timeout: 5000 }).toBe(0);
});
