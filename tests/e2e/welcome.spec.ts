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
    await expect(overlay).toContainText('Welcome');
    await expect(overlay).toBeHidden({ timeout: 9000 });
    await expect(page.locator('html')).not.toHaveAttribute('data-welcome', '');
  });

  test('ends on Welcome in Spanish too', async ({ page }) => {
    await page.goto('/es/');
    const words = await page.locator('.welcome-word').allTextContents();
    expect(words.at(-1)).toBe('Welcome');
    expect(words).toContain('Bienvenido');
  });

  test('dives into the "o" of Welcome before the hero shows', async ({ page }) => {
    await page.goto('/');
    const overlay = page.locator('#welcome');
    await expect(overlay).toHaveAttribute('data-zoom', '', { timeout: 6000 });
    // The loader is still up while the word grows from inside its "o".
    await expect(page.locator('html')).toHaveAttribute('data-welcome', '');
    const welcome = page.locator('.welcome-word').last();
    const origin = await welcome.evaluate((el) => el.style.transformOrigin);
    expect(origin).toMatch(/px/);
    // The reel came to rest on Welcome: it has moved up by exactly every word before it.
    const off = await welcome.evaluate((el) => {
      const reel = el.parentElement!;
      const shift = new DOMMatrix(getComputedStyle(reel).transform).m42;
      return Math.abs(shift + (reel.children.length - 1) * reel.children[0].getBoundingClientRect().height);
    });
    expect(off).toBeLessThan(1);
    // The dive is seen: the overlay is still opaque when it starts (its fade once reused the page-load
    // animation, which had already run past its delay, so the overlay vanished at once).
    expect(Number(await overlay.evaluate((el) => getComputedStyle(el).opacity))).toBeGreaterThan(0.9);
    await expect(page.locator('html')).not.toHaveAttribute('data-welcome', '', { timeout: 4000 });
    await expect(overlay).toBeHidden();
  });

  // A new navigation in the same session skips it; a reload (F5) plays it again (next test).
  test('is shown once per session', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#welcome')).toBeHidden({ timeout: 10000 });
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
    await expect(page.locator('#welcome')).toBeHidden({ timeout: 10000 });
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
    // Short timeout: the sequence would end by itself within ~6 s, so only an immediate skip passes.
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
