import { expect, test } from './fixtures';

test.describe('agent', () => {
  test('keyboard only: open from the menu, ask, read tool calls and answer, close with Escape', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    // The agent entry lives in the side menu; the menu closes first, so focus returns to the menu button.
    const button = page.getByRole('button', { name: 'Open menu' });
    await button.focus();
    await page.keyboard.press('Enter');
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('button', { name: /Ask my hologram/ }).focus();
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
    await expect(page.getByRole('dialog').getByRole('textbox')).toBeFocused();
    const dialog = page.getByRole('dialog', { name: 'Pregunta sobre Ernesto' });
    await expect(dialog).toBeVisible();
    await page.keyboard.type('qué tecnologías usa');
    await page.keyboard.press('Enter');
    await expect(dialog.getByText(/Python, FastAPI y PostgreSQL/)).toBeVisible({ timeout: 15000 });
    await page.keyboard.press('Control+k');
    await expect(dialog).toBeHidden();
  });

  test('the hero hologram is a button that opens the agent', async ({ page }) => {
    await page.goto('/es/');
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    await page.getByRole('button', { name: /Pregunta a mi holograma/ }).click();
    await expect(page.getByRole('dialog', { name: 'Pregunta sobre Ernesto' })).toBeVisible();
    await expect(page.getByRole('dialog').getByRole('textbox')).toBeFocused();
  });

  test('under the hologram, example questions type in a loop', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    // The live copy; its first text node is the typed question.
    const typed = page.locator('.hero-ask-typed > :last-child');
    const question = () => typed.evaluate((el) => el.firstChild?.textContent);
    // Under load the loop may be anywhere by now: catch whichever question is fully typed, then wait for the next.
    const items = ['What has he built?', 'How does the Ring agent work?', "What's his stack?", 'Is he available?'];
    let first = '';
    await expect.poll(async () => items.includes((first = (await question()) ?? '')), { timeout: 15000 }).toBe(true);
    await expect.poll(question, { timeout: 15000 }).toBe(items[(items.indexOf(first) + 1) % items.length]);
  });

  test('after the question: the shortcut with a mouse, [Click] on touch', async ({ page }, info) => {
    await page.goto('/');
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    const label = page.locator('.hero-ask-typed > :last-child');
    if (info.project.name === 'mobile') {
      await expect(label.getByText('[Click]')).toBeVisible();
      await expect(label.locator('kbd')).toBeHidden();
    } else {
      await expect(label.locator('kbd')).toHaveText('[Ctrl + K]');
      await expect(label.getByText('[Click]')).toBeHidden();
    }
    await expect(label).not.toContainText('[Ask]');
  });

  test('with a mouse, an [Ask] tag follows the pointer over the hologram', async ({ page }, info) => {
    test.skip(info.project.name === 'mobile', 'no hover on touch');
    await page.goto('/');
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    const tag = page.locator('.hero-ask-cursor');
    await expect(tag).toHaveCSS('opacity', '0');
    const box = (await page.locator('.hero-ask').boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect(tag).toHaveCSS('opacity', '1');
    await expect(tag).toContainText('Ask');
    await expect(tag).not.toContainText('Ctrl');
    const at = (await tag.boundingBox())!;
    expect(Math.abs(at.x - (box.x + box.width / 2 + 18))).toBeLessThan(4);
  });

  test('the panel opens as an orb that stretches into the bar, and folds back into the orb while it works', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    // Frozen timers: the orb stage cannot slip by before the check on a slow machine.
    await page.clock.install();
    await page.clock.pauseAt(Date.now() + 1000);
    await page.keyboard.press('Control+k');
    const shell = page.locator('.agent-shell');
    await expect(shell).toHaveAttribute('data-stage', 'orb');
    await page.clock.runFor(1000);
    await expect(shell).toHaveAttribute('data-stage', 'bar');
    await page.clock.resume();
    await expect(page.getByRole('textbox', { name: 'Your question' })).toBeFocused();
    await page.keyboard.type('what is his stack');
    await page.keyboard.press('Enter');
    await expect(shell).toHaveAttribute('data-stage', 'think');
    await expect(page.getByRole('dialog').getByText(/Python, FastAPI and PostgreSQL/)).toBeVisible({ timeout: 15000 });
    await expect(shell).toHaveAttribute('data-stage', 'bar');
  });

  test('typing straight after Ctrl+K, while the orb is still opening, keeps every letter in order', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    // Freeze timers so the orb cannot finish opening before the check, however slow the machine.
    await page.clock.install();
    await page.clock.pauseAt(Date.now() + 1000);
    await page.keyboard.press('Control+k');
    const field = page.getByRole('textbox', { name: 'Your question' });
    await expect(field).toBeFocused();
    await expect(page.locator('.agent-shell')).toHaveAttribute('data-stage', 'orb');
    await page.keyboard.type('what is his stack');
    await expect(field).toHaveValue('what is his stack');
    await page.clock.runFor(1000);
    await expect(page.locator('.agent-shell')).toHaveAttribute('data-stage', 'bar');
    await expect(field).toHaveValue('what is his stack');
  });

  test('the field never resizes while the bar stretches (an accented letter typed meanwhile kept its caret)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    await page.clock.install();
    await page.clock.pauseAt(Date.now() + 1000);
    await page.keyboard.press('Control+k');
    const field = page.getByRole('textbox', { name: 'Your question' });
    await expect(field).toBeFocused();
    await expect(page.locator('.agent-shell')).toHaveAttribute('data-stage', 'orb');
    // Layout width: the pop-in scale() transform does not move the caret.
    const width = () => field.evaluate((el) => (el as HTMLElement).offsetWidth);
    const collapsed = await width();
    await page.clock.runFor(1000);
    await expect(page.locator('.agent-shell')).toHaveAttribute('data-stage', 'bar');
    expect(await width()).toBe(collapsed);
    // And once open, the bar holds the field and the send button without clipping either.
    const fits = await page.locator('.agent-shell').evaluate((shell) => {
      const s = shell.getBoundingClientRect();
      const send = shell.querySelector('.agent-send')!.getBoundingClientRect();
      return send.right <= s.right - 4;
    });
    expect(fits).toBe(true);
  });

  test('closing forgets the conversation, even one still answering', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog', { name: 'Ask about Ernesto' });
    await expect(page.getByRole('textbox', { name: 'Your question' })).toBeFocused();
    await page.keyboard.type('what is his stack');
    await page.keyboard.press('Enter');
    await expect(dialog.getByText(/Python, FastAPI and PostgreSQL/)).toBeVisible({ timeout: 15000 });
    await page.keyboard.type('is he available');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Control+k');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('region', { name: 'Ask about Ernesto' })).toHaveCount(0);
    await expect(page.getByRole('textbox', { name: 'Your question' })).toHaveValue('');
    await expect(page.getByRole('textbox', { name: 'Your question' })).toBeFocused();
    // Closed mid-answer: nothing of it shows up after reopening.
    await page.keyboard.type('email');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Control+k');
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(3000);
    await expect(dialog.getByRole('region', { name: 'Ask about Ernesto' })).toHaveCount(0);
  });

  test('the conversation scrolls without a visible scrollbar', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('textbox', { name: 'Your question' })).toBeFocused();
    await page.keyboard.type('what has he built');
    await page.keyboard.press('Enter');
    await expect(page.locator('.agent-card')).toHaveCSS('scrollbar-width', 'none');
  });

  test('scrolling past the end of the answers never scrolls the page behind', async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'mouse wheel');
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    await page.keyboard.press('Control+k');
    const field = page.getByRole('textbox', { name: 'Your question' });
    await expect(field).toBeFocused();
    for (const q of ['what has he built', 'what is his stack', 'how does the ring agent work', 'is he available']) {
      await page.keyboard.type(q);
      await page.keyboard.press('Enter');
      await expect(field).toHaveValue('');
    }
    const card = page.locator('.agent-card');
    const before = await page.evaluate(() => scrollY);
    const box = (await card.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    for (let i = 0; i < 12; i++) await page.mouse.wheel(0, 600);
    await page.waitForTimeout(600);
    // The card itself scrolled to its end...
    expect(await card.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    // ...and neither that nor a wheel over the backdrop moved the page.
    await page.mouse.move(10, 10);
    for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 600);
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => scrollY)).toBe(before);
    await context.close();
  });

  test('with reduced motion the bar is there at once and never folds', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    await page.keyboard.press('Control+k');
    const shell = page.locator('.agent-shell');
    await expect(shell).toHaveAttribute('data-stage', 'bar');
    await page.keyboard.type('email');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog').getByText(/Email is fastest/).first()).toBeVisible({ timeout: 1000 });
    await expect(shell).toHaveAttribute('data-stage', 'bar');
    await context.close();
  });

  test('Tab on the empty field takes the example question on screen, then moves on', async ({ page }, info) => {
    test.skip(info.project.name === 'mobile', 'no Tab key on touch');
    await page.goto('/');
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    await page.keyboard.press('Control+k');
    const field = page.getByRole('textbox', { name: 'Your question' });
    await expect(field).toBeFocused();
    await expect(page.locator('.agent-shell')).toHaveAttribute('data-stage', 'bar');
    await page.keyboard.press('Tab');
    await expect(field).toHaveValue('What has he built?');
    await expect(field).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(field).not.toBeFocused();
  });

  test('the question field shows no amber focus ring', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    await page.keyboard.press('Control+k');
    const field = page.getByRole('textbox', { name: 'Your question' });
    await field.click();
    await expect(field).toHaveCSS('outline-style', 'none');
    // Focus is still shown, in neutral ink, on the bar around it.
    await expect(page.locator('.agent-shell')).toHaveCSS('border-top-color', 'rgb(124, 118, 106)');
  });

  test('unknown questions get the fallback with suggested questions', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('dialog').getByRole('textbox')).toBeFocused();
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
    await expect(page.getByRole('dialog').getByRole('textbox')).toBeFocused();
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
    await expect(page.getByRole('dialog').getByRole('textbox')).toBeFocused();
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
    await expect(page.getByRole('dialog').getByRole('textbox')).toBeFocused();
    await page.keyboard.type('contact');
    await page.keyboard.press('Enter');
    const go = page.getByRole('button', { name: 'Go to contact' });
    await go.waitFor({ timeout: 15000 });
    await go.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#contact')).toBeFocused();
  });
});
