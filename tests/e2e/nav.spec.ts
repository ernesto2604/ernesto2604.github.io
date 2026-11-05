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
  const title = page.getByRole('heading', { level: 1, name: "I'm Ernesto, AI Engineer", exact: true });
  await expect(title).toBeVisible();
  // Without JS the loop rests on its first text.
  await expect(title.getByText("I'm Ernesto", { exact: true }).last()).toBeVisible();
  // The query now opens Retrieval; its scores below still answer it.
  await expect(page.getByText('Who is Ernesto and what has he built?').first()).toBeVisible();
  // The menu cannot open without JS, so its links render as a plain block.
  await expect(page.locator('#site-menu').getByRole('link', { name: 'Work' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ring TelemetryOps' })).toBeVisible();
  await expect(page.locator('.story-row').first()).toContainText('1.000');
  await expect(page.getByRole('button', { name: /Ask the agent/ })).toHaveCount(0);
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

test('"Read the case studies" lands on section 03 with its content on screen', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'pinned desktop layout');
  await page.goto('/#retrieval');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await page.waitForSelector('html.lenis', { state: 'attached' }); // smooth scrolling is loaded after hydration
  await page.getByRole('link', { name: 'Read the case studies' }).click();
  // Generous: under a parallel run the software-rendered hologram starves the smooth-scroll frames.
  await expect.poll(() => page.evaluate(() => Math.round(document.getElementById('generate')!.getBoundingClientRect().top)), { timeout: 20000 }).toBe(0);
  await expect(page.getByRole('heading', { level: 2, name: 'Three systems, from the inside' })).toBeInViewport({ timeout: 5000 });
  await expect(page.getByRole('button', { name: 'Open Ring TelemetryOps' })).toBeInViewport();
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
  await expect(page.locator('.hero-scroll [aria-hidden]')).toHaveText('Scroll to explore');
  const mid = (sel: string) => page.locator(sel).evaluate((el) => { const r = el.getBoundingClientRect(); return r.left + r.width / 2; });
  expect(Math.abs((await mid('.hero-ask-label')) - (await mid('.holo-canvas')))).toBeLessThan(2);
});
