import { expect, test } from './fixtures';

test('deep link to a section lands on it after hydration', async ({ page }) => {
  await page.goto('/es/#skills');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await expect(page.locator('#skills')).toBeInViewport();
});

test('language toggle keeps the hash and stores the choice', async ({ page }) => {
  await page.goto('/#skills');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('link', { name: /Leer en español/ }).click();
  await expect(page).toHaveURL(/\/es\/#skills$/);
  expect(await page.evaluate(() => localStorage.getItem('locale'))).toBe('es');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await page.getByRole('button', { name: 'Abrir menú' }).click();
  await page.getByRole('link', { name: /Read in English/ }).click();
  await expect(page).toHaveURL(/localhost:\d+\/#skills$/);
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
  const title = page.getByRole('heading', { level: 1, name: "I'm Ernesto, AI Engineer", exact: true });
  await expect(title).toBeVisible();
  // Without JS the loop rests on its first text.
  await expect(title.getByText("I'm Ernesto", { exact: true }).last()).toBeVisible();
  // The menu cannot open without JS, so its links render as a plain block.
  await expect(page.locator('#site-menu').getByRole('link', { name: 'Work' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open Ring TelemetryOps' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Ask my hologram/ })).toHaveCount(0);
  await context.close();
});

test('the hero title opens on my name and morphs into my role', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  // The shown text is the morph layer at full opacity.
  const shown = () =>
    page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('h1 [aria-hidden] > .absolute')].find((s) => getComputedStyle(s).opacity === '1')?.textContent,
    );
  await page.waitForFunction(() => !document.documentElement.hasAttribute('data-welcome'), null, { timeout: 15000 });
  await expect.poll(shown).toBe("I'm Ernesto");
  // The first morph goes to the role: one hold (2.5s) plus one morph (1.5s), with margin.
  await expect.poll(shown, { timeout: 6000 }).toBe('AI Engineer');
  // Settled, not a single frame: it holds for the cooldown.
  await page.waitForTimeout(800);
  expect(await shown()).toBe('AI Engineer');
});

test('with reduced motion the hero title stays on my name', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await page.waitForTimeout(5000);
  await expect(page.locator('h1 [aria-hidden] > .absolute').last()).toHaveText("I'm Ernesto");
  await expect(page.locator('h1 [aria-hidden] > .absolute').first()).toHaveCSS('opacity', '0');
  await context.close();
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

test('no page is wider than the screen (the typed line under the hologram once pushed it sideways)', async ({ page }) => {
  for (const path of ['/', '/es/']) {
    await page.goto(path);
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    await page.waitForFunction(() => !document.documentElement.hasAttribute('data-welcome'), null, { timeout: 15000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  }
});

test('the hero closes with a scroll cue and the ask line is centred on the figure', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  // The live copy (the first holds the width); typed in once the loader has gone.
  await expect(page.locator('.hero-scroll [aria-hidden] > :last-child')).toHaveText('[Scroll to explore]', { timeout: 10000 });
  const mid = (sel: string) => page.locator(sel).evaluate((el) => { const r = el.getBoundingClientRect(); return r.left + r.width / 2; });
  expect(Math.abs((await mid('.hero-ask-label')) - (await mid('.holo-canvas')))).toBeLessThan(2);
});
