import { test, expect } from '../support/test';
import type { Page } from '@playwright/test';
import { waitForImages } from '../support/sizing';

// Whole pages and the header, so a change to the header or the theme shows up somewhere. The tiles have their own
// baselines in templates.spec.

const pages = {
  landing: '/',
  'projects-empty': '/projects',
  'not-found': '/this-does-not-exist',
  tutorial: '/tutorial',
};

async function open(page: Page, url: string) {
  await page.goto(url);
  await expect(page.locator('pg-header').first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await waitForImages(page);
}

/** The quota figure depends on the browser's storage estimate. */
const dynamic = (page: Page) => [page.locator('photogram-quota')];

const schemes = ['light', 'dark'] as const;
const suffix = (scheme: (typeof schemes)[number]) => (scheme === 'dark' ? '-dark' : '');

for (const scheme of schemes) {
  for (const width of [1280, 700]) {
    test.describe(`${scheme} @${width}`, () => {
      test.use({ viewport: { width, height: 900 }, colorScheme: scheme });

      for (const [name, url] of Object.entries(pages)) {
        test(name, async ({ page }) => {
          await open(page, url);
          await expect(page).toHaveScreenshot(`${name}-${width}${suffix(scheme)}.png`, { mask: dynamic(page) });
        });
      }
    });
  }

  // Print is always light: under the dark scheme, a page prints as the light baseline.
  test.describe(`${scheme} print`, () => {
    test.use({ viewport: { width: 1280, height: 900 }, colorScheme: scheme });

    for (const [name, url] of Object.entries(pages)) {
      test(name, async ({ page }) => {
        await open(page, url);
        await page.emulateMedia({ media: 'print' });
        await waitForImages(page);
        await expect(page).toHaveScreenshot(`${name}-print.png`, { mask: dynamic(page) });
      });
    }
  });
}

/** The theme picked in the header's switch wins over the system's, on screen only, from the first paint. */
test.describe('theme override', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  const background = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const dark = 'rgb(34, 34, 34)';
  const light = 'rgb(255, 255, 255)';

  test('the switch overrides the system, and the next visit keeps it', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await open(page, '/');
    expect(await background(page)).toBe(light);
    await page.getByRole('button', { name: 'Dark' }).click();
    await expect(page.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');
    expect(await background(page)).toBe(dark);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');
    expect(await background(page)).toBe(dark);

    await page.emulateMedia({ colorScheme: 'dark' });
    await page.getByRole('button', { name: 'Light' }).click();
    expect(await background(page)).toBe(light);
    await page.getByRole('button', { name: 'Auto' }).click();
    expect(await background(page)).toBe(dark);
    expect(await page.evaluate(() => localStorage.getItem('pg-theme'))).toBeNull();
  });

  test('applies before the scripts run: no light flash', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(() => localStorage.setItem('pg-theme', 'dark'));
    // Only the HTML and the CSS: what paints before the app's module loads.
    await page.route('**/assets/*.js', route => route.abort());
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark');
    expect(await background(page)).toBe(dark);
    const themeColors = page.locator('meta[name="theme-color"]');
    await expect(themeColors).toHaveCount(2);
    expect(await themeColors.evaluateAll(metas => metas.map(meta => [meta.getAttribute('content'), meta.getAttribute('media')]))).toEqual([
      ['#ffffff', 'not all'],
      ['#222222', 'all'],
    ]);
  });

  test('dark, printed light', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('pg-theme', 'dark'));
    await open(page, '/');
    await page.emulateMedia({ media: 'print' });
    await waitForImages(page);
    await expect(page).toHaveScreenshot('landing-print.png', { mask: dynamic(page) });
  });
});

for (const scheme of schemes) {
  test.describe(`${scheme} header`, () => {
    test.use({ viewport: { width: 1280, height: 900 }, colorScheme: scheme });

    // The header follows the scheme; print is always light, so its print baselines are shared.
    test('nav hover', async ({ page }) => {
      await open(page, '/tutorial');
      await page.getByRole('link', { name: 'Projects' }).hover();
      await expect(page.locator('pg-header')).toHaveScreenshot(`header-hover${suffix(scheme)}.png`);
    });

    test('nav focus', async ({ page }) => {
      await open(page, '/tutorial');
      const link = page.getByRole('link', { name: 'Tutorial' });
      for (let i = 0; i < 10 && !(await link.evaluate(element => element.matches(':focus-visible'))); i++) {
        await page.keyboard.press('Tab');
      }
      await expect(link).toBeFocused();
      await expect(page.locator('pg-header')).toHaveScreenshot(`header-focus${suffix(scheme)}.png`);
    });

    test('theme switch hover and focus', async ({ page }) => {
      await open(page, '/tutorial');
      const light = page.getByRole('button', { name: 'Light' });
      for (let i = 0; i < 12 && !(await light.evaluate(element => element.matches(':focus-visible'))); i++) {
        await page.keyboard.press('Tab');
      }
      await expect(light).toBeFocused();
      await page.getByRole('button', { name: 'Dark' }).hover();
      await expect(page.locator('pg-theme-switch')).toHaveScreenshot(`theme-switch-states${suffix(scheme)}.png`);
    });

    test('print', async ({ page }) => {
      await open(page, '/tutorial');
      await page.emulateMedia({ media: 'print' });
      await expect(page.locator('pg-header')).toHaveScreenshot('header-print.png');
    });
  });
}

test.describe('header', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('forced colours', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active', colorScheme: 'light' });
    await open(page, '/tutorial');
    await expect(page.locator('pg-header')).toHaveScreenshot('header-forced-colors.png');
  });
});
