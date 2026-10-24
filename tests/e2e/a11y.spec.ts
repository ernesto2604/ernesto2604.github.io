import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

async function seriousViolations(page: Page) {
  await page.waitForTimeout(1500); // let entrance animations finish so contrast is measured at rest
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  return violations
    .filter((v) => v.impact === 'critical' || v.impact === 'serious')
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`);
}

for (const path of ['/', '/es/']) {
  test(`${path} has no critical or serious axe violations`, async ({ page }) => {
    await page.goto(path);
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    expect(await seriousViolations(page)).toEqual([]);
  });

  test(`${path} stacked (reduced motion) has no critical or serious axe violations`, async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(path);
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    expect(await seriousViolations(page)).toEqual([]);
    await context.close();
  });
}

for (const [path, open] of [['/', 'Open menu'], ['/es/', 'Abrir menú']]) {
  test(`${path} with the side menu open has no critical or serious axe violations`, async ({ page }) => {
    await page.goto(path);
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    await page.getByRole('button', { name: open }).click();
    await expect(page.locator('#site-menu')).toBeVisible();
    expect(await seriousViolations(page)).toEqual([]);
  });
}

test('/es/ with the agent panel open has no critical or serious axe violations', async ({ page }) => {
  await page.goto('/es/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('textbox')).toBeFocused();
  await page.keyboard.type('ring');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog').getByText(/Ring TelemetryOps/).first()).toBeVisible({ timeout: 15000 });
  expect(await seriousViolations(page)).toEqual([]);
});

test('the open agent panel has no critical or serious axe violations', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('textbox')).toBeFocused();
  await page.keyboard.type('ring');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog').getByText(/Ring TelemetryOps diagnoses/).first()).toBeVisible({ timeout: 15000 });
  expect(await seriousViolations(page)).toEqual([]);
});
