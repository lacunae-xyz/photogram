import { test, expect } from '../support/test';
import type { Page } from '@playwright/test';
import { galleryUrl, routeGallery } from '../support/gallery';
import { waitForImages } from '../support/sizing';

// The design system's gallery (packages/design-system/index.html): every pg-* element and its states, light and
// dark. Print is always light: under the dark scheme it matches the light print baseline.

const schemes = ['light', 'dark'] as const;
const suffix = (scheme: (typeof schemes)[number]) => (scheme === 'dark' ? '-dark' : '');

async function open(page: Page) {
  await routeGallery(page);
  await page.goto(galleryUrl);
  await expect(page.locator('pg-header')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect
    .poll(() =>
      page.locator('pg-illustration').evaluateAll(elements => elements.every(element => element.shadowRoot?.querySelector('img'))),
    )
    .toBe(true);
  await waitForImages(page);
}

for (const scheme of schemes) {
  test.describe(scheme, () => {
    test.use({ viewport: { width: 1280, height: 900 }, colorScheme: scheme });

    test('gallery', async ({ page }) => {
      await open(page);
      await expect(page).toHaveScreenshot(`gallery${suffix(scheme)}.png`, { fullPage: true });
    });

    test('gallery, print', async ({ page }) => {
      await open(page);
      await page.emulateMedia({ media: 'print' });
      await waitForImages(page);
      await expect(page).toHaveScreenshot('gallery-print.png', { fullPage: true });
    });

    test('dialog', async ({ page }) => {
      await open(page);
      await page.getByRole('button', { name: 'Open the dialog' }).click();
      await expect(page.getByRole('dialog', { name: 'Shot 12' })).toBeVisible();
      await page.mouse.move(0, 0);
      await expect(page).toHaveScreenshot(`gallery-dialog${suffix(scheme)}.png`);
    });

    test('hover and focus', async ({ page }) => {
      await open(page);
      const shots: [string, () => Promise<void>][] = [
        ['button-hover', () => page.getByRole('button', { name: 'Export data.json' }).hover()],
        ['button-focus', () => page.getByRole('button', { name: 'Export data.json' }).focus()],
        ['icon-button-hover', () => page.getByRole('button', { name: 'Print' }).hover()],
        ['big-button-hover', () => page.getByRole('button', { name: 'Import project' }).first().hover()],
        ['big-button-focus', () => page.getByRole('button', { name: 'Import project' }).first().focus()],
      ];
      for (const [name, act] of shots) {
        await page.mouse.move(0, 0);
        await act();
        await expect(page.locator(name.startsWith('big') ? '#big-buttons' : '#buttons')).toHaveScreenshot(
          `gallery-${name}${suffix(scheme)}.png`,
        );
        await page.locator('body').evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      }
      await page.mouse.move(0, 0);
      await page.locator('pg-card').first().hover();
      await expect(page.locator('main .cards')).toHaveScreenshot(`gallery-card-hover${suffix(scheme)}.png`);
    });
  });
}
