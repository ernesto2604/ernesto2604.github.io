import { expect, test } from './fixtures';

test.describe('side menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  });

  test('keyboard opens it with aria-expanded, Escape closes it and focus returns to the button', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Open menu' });
    await expect(button).toHaveAttribute('aria-controls', 'site-menu');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await button.focus();
    await page.keyboard.press('Enter');
    const menu = page.getByRole('dialog', { name: 'Menu' });
    await expect(menu).toBeVisible();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(menu.getByRole('link', { name: 'Work' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'About' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Contact' })).toBeVisible();
    await expect(menu.getByRole('link', { name: /Leer en español/ })).toBeVisible();
    await expect(menu.getByRole('button', { name: /Ask the agent/ })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toBeFocused();
  });

  test('Tab and Shift+Tab stay inside the open panel', async ({ page }) => {
    await page.getByRole('button', { name: 'Open menu' }).click();
    const menu = page.locator('#site-menu');
    const inside = () => page.evaluate(() => !!document.activeElement?.closest('#site-menu'));
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      expect(await inside()).toBe(true);
    }
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Shift+Tab');
      expect(await inside()).toBe(true);
    }
    await expect(menu).toBeVisible();
  });

  test('backdrop click closes it, and the background is inert and scroll-locked while open', async ({ page }) => {
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-scroll-lock', '');
    // A modal <dialog> makes the rest of the page inert: page controls cannot take focus.
    const cta = page.locator('.story-hero a[href="#rerank"]');
    expect(await cta.evaluate((el: HTMLElement) => (el.focus(), document.activeElement === el))).toBe(false);
    await page.mouse.click(12, 200);
    await expect(page.locator('#site-menu')).toBeHidden();
    await expect(page.locator('html')).not.toHaveAttribute('data-scroll-lock', '');
    expect(await cta.evaluate((el: HTMLElement) => (el.focus(), document.activeElement === el))).toBe(true);
  });

  test('locking scroll does not shift the layout', async ({ page }) => {
    const left = () => page.getByRole('heading', { level: 1 }).evaluate((h) => h.getBoundingClientRect().left);
    const before = await left();
    await page.getByRole('button', { name: 'Open menu' }).click();
    expect(await left()).toBe(before);
  });

  test('a link closes the panel and moves to its section', async ({ page }) => {
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('dialog', { name: 'Menu' }).getByRole('link', { name: 'Contact' }).click();
    await expect(page.locator('#site-menu')).toBeHidden();
    await expect(page.locator('#contact')).toBeInViewport({ timeout: 4000 });
    await expect(page.locator('#contact')).toBeFocused();
  });

  test('Ctrl+K still opens the agent, and closes the menu first', async ({ page }) => {
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.keyboard.press('Control+k');
    await expect(page.locator('#site-menu')).toBeHidden();
    await expect(page.getByRole('dialog', { name: 'Ask about Ernesto' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Your question' })).toBeFocused();
  });

  test('the button is a 44px+ target', async ({ page }) => {
    const box = (await page.getByRole('button', { name: 'Open menu' }).boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  });
});
