import { expect, test } from './fixtures';

test('deep link to a stage lands on that section after hydration', async ({ page }) => {
  await page.goto('/es/#retrieval');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await expect(page.locator('#retrieval')).toBeInViewport();
});

test('language toggle keeps the hash and stores the choice', async ({ page }) => {
  await page.goto('/#rerank');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('link', { name: /Leer en español/ }).click();
  await expect(page).toHaveURL(/\/es\/#rerank$/);
  expect(await page.evaluate(() => localStorage.getItem('locale'))).toBe('es');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await page.getByRole('button', { name: 'Abrir menú' }).click();
  await page.getByRole('link', { name: /Read in English/ }).click();
  await expect(page).toHaveURL(/localhost:\d+\/#rerank$/);
});

test('first Tab press reaches the skip link', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium');
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
});


test('progress pill shows the stage in view and its list jumps to a section', async ({ page }) => {
  await page.goto('/#rerank');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  const pill = page.getByRole('navigation', { name: 'Progress' });
  const button = pill.getByRole('button');
  await expect(button).toContainText('Rerank');
  await button.click();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(pill.locator('[aria-current="step"]')).toHaveAttribute('href', '#rerank');
  await pill.getByRole('link', { name: /Output/ }).click();
  await expect(pill.getByRole('list')).toBeHidden();
  await expect(button).toContainText('Output', { timeout: 5000 });
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

test('deep link to a case study puts its card on top with the diagram drawn', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'pinned mode is desktop only');
  await page.goto('/es/#hybrid-rag-api');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await expect(page.locator('#hybrid-rag-api')).toHaveAttribute('data-pos', 'current');
  await expect(page.locator('#ring-telemetryops')).toHaveAttribute('data-pos', 'past');
  const drawn = await page.evaluate(() => Number(getComputedStyle(document.querySelector('#hybrid-rag-api .diagram')!).getPropertyValue('--p')));
  expect(drawn).toBeGreaterThan(0.95);
});

test('deep link into the story sets the matching phase', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'pinned mode is desktop only');
  await page.goto('/es/#retrieval');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await expect(page.locator('.story')).toHaveAttribute('data-phase', 'retrieval');
});
