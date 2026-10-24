import { expect, test } from './fixtures';

test.describe('agent', () => {
  test('keyboard only: open from the menu, ask, read tool calls and answer, close with Escape', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    // The agent entry lives in the side menu; the menu closes first, so focus returns to the menu button.
    const button = page.getByRole('button', { name: 'Open menu' });
    await button.focus();
    await page.keyboard.press('Enter');
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('button', { name: /Ask the agent/ }).focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Ask about Ernesto' });
    await expect(dialog).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Your question' })).toBeFocused();

    await page.keyboard.type('tell me about the ring project');
    await page.keyboard.press('Enter');
    await expect(dialog.getByText('read_repo')).toBeVisible();
    await expect(dialog.getByText(/Ring TelemetryOps diagnoses degraded video doorbells/)).toBeVisible({ timeout: 15000 });
    await expect(dialog.getByRole('button', { name: 'Open the Ring case study' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(button).toBeFocused();
  });

  test('Ctrl+K toggles the panel and the answer follows the page language', async ({ page }) => {
    await page.goto('/es/');
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('textbox')).toBeFocused();
    const dialog = page.getByRole('dialog', { name: 'Pregunta sobre Ernesto' });
    await expect(dialog).toBeVisible();
    await page.keyboard.type('qué tecnologías usa');
    await page.keyboard.press('Enter');
    await expect(dialog.getByText(/Python, FastAPI y PostgreSQL/)).toBeVisible({ timeout: 15000 });
    await page.keyboard.press('Control+k');
    await expect(dialog).toBeHidden();
  });

  test('unknown questions get the fallback with suggested questions', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('textbox')).toBeFocused();
    await page.keyboard.type('what is the weather in paris');
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/I can't answer that/)).toBeVisible({ timeout: 15000 });
    await expect(dialog.getByRole('button', { name: 'What has he built?' }).last()).toBeVisible();
  });

  test('reduced motion shows the answer without streaming delays', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('textbox')).toBeFocused();
    await page.keyboard.type('email');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog').getByText(/Email is fastest/).first()).toBeVisible({ timeout: 1000 });
    await context.close();
  });

  test('a scroll action closes the panel and lands on the target', async ({ page }, info) => {
    test.skip(info.project.name === 'mobile');
    await page.goto('/');
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('textbox')).toBeFocused();
    await page.keyboard.type('contact');
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Go to contact' }).click({ timeout: 15000 });
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.locator('#contact')).toBeInViewport({ timeout: 4000 });
  });

  test('after a scroll action, keyboard focus moves to the target section', async ({ page }, info) => {
    test.skip(info.project.name === 'mobile');
    await page.goto('/');
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('textbox')).toBeFocused();
    await page.keyboard.type('contact');
    await page.keyboard.press('Enter');
    const go = page.getByRole('button', { name: 'Go to contact' });
    await go.waitFor({ timeout: 15000 });
    await go.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#contact')).toBeFocused();
  });
});
