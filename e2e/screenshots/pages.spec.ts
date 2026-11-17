import { test, expect } from '../support/test';
import type { Page } from '@playwright/test';
import { waitForImages } from '../support/sizing';

// Whole pages and the header, so a change to the chrome or the theme shows up somewhere. The tiles have their own
// baselines in templates.spec.

const pages = {
  landing: '/',
  'projects-empty': '/projects',
  'not-found': '/this-does-not-exist',
  tutorial: '/tutorial',
};

async function open(page: Page, url: string) {
  await page.goto(url);
  await expect(page.locator('pg-header, .header-container').first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await waitForImages(page);
}

/** The quota figure depends on the browser's storage estimate. */
const dynamic = (page: Page) => [page.locator('photogram-quota')];

for (const width of [1280, 700]) {
  test.describe(`@${width}`, () => {
    test.use({ viewport: { width, height: 900 } });

    for (const [name, url] of Object.entries(pages)) {
      test(name, async ({ page }) => {
        await open(page, url);
        await expect(page).toHaveScreenshot(`${name}-${width}.png`, { mask: dynamic(page) });
      });
    }
  });
}

test.describe('header', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('nav hover', async ({ page }) => {
    await open(page, '/tutorial');
    await page.getByRole('link', { name: 'Projects' }).hover();
    await expect(page.locator('pg-header')).toHaveScreenshot('header-hover.png');
  });

  test('nav focus', async ({ page }) => {
    await open(page, '/tutorial');
    const link = page.getByRole('link', { name: 'Tutorial' });
    for (let i = 0; i < 10 && !(await link.evaluate(element => element.matches(':focus-visible'))); i++) {
      await page.keyboard.press('Tab');
    }
    await expect(link).toBeFocused();
    await expect(page.locator('pg-header')).toHaveScreenshot('header-focus.png');
  });

  test('forced colours', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active', colorScheme: 'light' });
    await open(page, '/tutorial');
    await expect(page.locator('pg-header')).toHaveScreenshot('header-forced-colors.png');
  });

  test('print', async ({ page }) => {
    await open(page, '/tutorial');
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('pg-header')).toHaveScreenshot('header-print.png');
  });

  test("Fixor's, print", async ({ page }) => {
    await open(page, '/fixor');
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.header-container')).toHaveScreenshot('fixor-header-print.png');
  });
});
