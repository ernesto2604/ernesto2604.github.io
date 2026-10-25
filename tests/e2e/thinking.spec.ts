import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

// A thinking card on screen must belong to a block that is itself on screen and has not started to show its
// content. Otherwise it is floating over another section (a block a jump or fast scroll only passed through)
// or over content that is already being revealed. Sampled every 100 ms for 3 s after each navigation.
async function strayCards(page: Page) {
  const strays = new Set<string>();
  for (let i = 0; i < 30; i++) {
    const found = await page.evaluate(() => {
      const vh = innerHeight;
      // What the reader actually sees: the element's opacity times every ancestor's.
      const seen = (el: Element | null): number => (el ? Number(getComputedStyle(el).opacity) * seen(el.parentElement) : 1);
      const onScreen = (el: Element) => {
        const r = el.getBoundingClientRect();
        return r.bottom > 0 && r.top < vh && r.width > 0;
      };
      return [...document.querySelectorAll<HTMLElement>('[data-gen] > .thinking')]
        .filter((card) => card.checkVisibility({ visibilityProperty: true }) && seen(card) > 0.05)
        .filter((card) => onScreen(card.querySelector('.thinking-card') ?? card))
        .map((card) => card.parentElement!)
        .filter((block) => {
          if (!onScreen(block)) return true;
          // Its start is well above the screen: the reader is past it, the card would sit over what follows.
          if (block.getBoundingClientRect().top < -vh * 0.5) return true;
          if (block.dataset.gen === 'thinking') return false;
          // A finished block's card may still be fading: a problem only once its content has started to show.
          const items = block.querySelectorAll(':scope > :not(.thinking):not([data-stream]), :scope [data-stream] > :not([data-stream])');
          return [...items].some((el) => seen(el) > 0.05);
        })
        .map((block) => `${block.closest('[id]')?.id}:${block.dataset.gen}`);
    });
    found.forEach((s) => strays.add(s));
    await page.waitForTimeout(100);
  }
  return [...strays];
}

test.describe('thinking cards never float over other content', () => {
  test.beforeEach(async ({ page }, info) => {
    test.skip(info.project.name === 'mobile', 'the fixed, centred cards are the pinned desktop layout');
    await page.goto('/');
    await page.waitForSelector('html.lenis', { state: 'attached' });
  });

  for (const link of ['Contact', 'About', 'Work', 'Home']) {
    test(`menu jump to ${link}`, async ({ page }) => {
      if (link === 'Home') await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
      await page.getByRole('button', { name: 'Open menu' }).click();
      await page.getByRole('dialog', { name: 'Menu' }).getByRole('link', { name: link, exact: true }).click();
      expect(await strayCards(page)).toEqual([]);
    });
  }

  test('fast scroll to the footer', async ({ page }) => {
    await page.mouse.move(700, 400);
    for (let i = 0; i < 20; i++) await page.mouse.wheel(0, 1500);
    expect(await strayCards(page)).toEqual([]);
  });

  test('fast scroll down and back up', async ({ page }) => {
    await page.mouse.move(700, 400);
    for (let i = 0; i < 12; i++) await page.mouse.wheel(0, 900);
    expect(await strayCards(page)).toEqual([]);
    for (let i = 0; i < 12; i++) await page.mouse.wheel(0, -900);
    expect(await strayCards(page)).toEqual([]);
  });
});
