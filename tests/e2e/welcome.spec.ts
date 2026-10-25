import { expect, test } from './fixtures';

test.describe('welcome loader', () => {
  test.use({ welcome: true });

  test('plays once, ends on the page language and reveals the hero', async ({ page }) => {
    await page.goto('/');
    const overlay = page.locator('#welcome');
    await expect(overlay).toBeVisible();
    await expect(overlay).toHaveAttribute('aria-hidden', 'true');
    // The heading is in the HTML underneath the whole time; the overlay only covers it.
    await expect(page.getByRole('heading', { level: 1, name: 'AI Engineer' })).toBeAttached();
    await expect(overlay).toContainText('Welcome', { timeout: 3000 });
    await expect(overlay).toBeHidden({ timeout: 3000 });
    await expect(page.locator('html')).not.toHaveAttribute('data-welcome', '');
  });

  test('ends on Bienvenido in Spanish', async ({ page }) => {
    await page.goto('/es/');
    const words = JSON.parse((await page.locator('#welcome').getAttribute('data-words'))!);
    expect(words.at(-1)).toBe('Bienvenido');
    await expect(page.locator('#welcome')).toContainText('Bienvenido', { timeout: 3000 });
  });

  // A new navigation in the same session skips it; a reload (F5) plays it again (next test).
  test('is shown once per session', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#welcome')).toBeHidden({ timeout: 4000 });
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveAttribute('data-welcome', '');
    await expect(page.locator('#welcome')).toBeHidden();
  });

  test('a reload plays it again and opens on the hero, not the previous hash', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('welcomed', '1'));
    await page.goto('/#retrieval');
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
    await page.reload();
    await expect(page.locator('#welcome')).toBeVisible();
    expect(new URL(page.url()).hash).toBe('');
    await expect(page.locator('#welcome')).toBeHidden({ timeout: 4000 });
    expect(await page.evaluate(() => scrollY)).toBe(0);
    await expect(page.getByRole('heading', { level: 1, name: 'AI Engineer' })).toBeInViewport();
  });

  test('?welcome replays it even after it was seen this session', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('welcomed', '1'));
    await page.goto('/?welcome');
    await expect(page.locator('#welcome')).toBeVisible();
  });

  test('a click skips it', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#welcome')).toBeVisible();
    await page.mouse.click(200, 200);
    // Short timeout: the sequence would end by itself within ~2 s, so only an immediate skip passes.
    await expect(page.locator('html')).not.toHaveAttribute('data-welcome', '', { timeout: 300 });
    // Then the 560 ms fade-out finishes; generous wait so a busy machine does not flake.
    await expect(page.locator('#welcome')).toBeHidden({ timeout: 2000 });
  });

  test('any key skips it and does not trap focus', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#welcome')).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.locator('html')).not.toHaveAttribute('data-welcome', '', { timeout: 300 });
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused();
  });

  test('reduced motion never shows it', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveAttribute('data-welcome', '');
    await expect(page.locator('#welcome')).toBeHidden();
    await context.close();
  });

  test('without JavaScript it stays hidden and the content is visible', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('#welcome')).toBeHidden();
    await expect(page.getByRole('heading', { level: 1, name: 'AI Engineer' })).toBeVisible();
    await context.close();
  });
});
