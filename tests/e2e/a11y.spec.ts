import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

async function seriousViolations(page: Page) {
  // Let every entrance animation finish, so contrast is measured at rest.
  // Endless loops (status dot) never finish and are skipped.
  await page.waitForTimeout(300);
  await page.waitForFunction(
    () => document.getAnimations().every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity),
    null,
    { timeout: 20000 },
  );
  // The hero title morphs in a script loop (MorphingText): start right as a morph lands, at the top of its hold.
  // Gives up after 6s when the loop is not playing (reduced motion, title off screen).
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const layers = [...document.querySelectorAll<HTMLElement>('h1 [aria-hidden] > .absolute')];
        const atRest = () => layers.every((l) => ['0', '1'].includes(getComputedStyle(l).opacity));
        let done = false;
        const finish = () => ((done = true), resolve());
        const giveUp = setTimeout(finish, 6000);
        let moving = false;
        const frame = () => {
          if (done) return;
          if (!atRest()) moving = true;
          else if (moving) return (clearTimeout(giveUp), finish());
          requestAnimationFrame(frame);
        };
        frame();
      }),
  );
  const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
  const { violations } = await new AxeBuilder({ page }).withTags(tags).disableRules(['color-contrast']).analyze();
  // axe ignores mix-blend-mode, so it reads negative text (.ink-auto, difference blend) as pale on paper. Its real
  // contrast is checked in tests/unit/contrast.test.ts; everything else gets the usual colour-contrast check.
  const contrast = await new AxeBuilder({ page }).withRules(['color-contrast']).exclude('.ink-auto').analyze();
  return [...violations, ...contrast.violations]
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
  await expect(page.getByRole('dialog').getByRole('textbox')).toBeFocused();
  await page.keyboard.type('ring');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog').getByText(/Ring TelemetryOps/).first()).toBeVisible({ timeout: 15000 });
  expect(await seriousViolations(page)).toEqual([]);
});

test('the open agent panel has no critical or serious axe violations', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('dialog').getByRole('textbox')).toBeFocused();
  await page.keyboard.type('ring');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog').getByText(/Ring TelemetryOps diagnoses/).first()).toBeVisible({ timeout: 15000 });
  expect(await seriousViolations(page)).toEqual([]);
});
