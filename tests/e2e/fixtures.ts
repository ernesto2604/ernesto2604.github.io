import { test as base, expect } from '@playwright/test';

// The welcome loader plays once per session and covers the page for ~2 s. Specs about other features start
// as a returning visitor in the same session; welcome.spec.ts opts in with test.use({ welcome: true }).
export const test = base.extend<{ welcome: boolean }>({
  welcome: [false, { option: true }],
  page: async ({ page, welcome }, use) => {
    if (!welcome) await page.addInitScript(() => sessionStorage.setItem('welcomed', '1'));
    await use(page);
  },
});

export { expect };
