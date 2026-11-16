import { test, expect, tileSelector } from '../support/test';
import type { Page } from '@playwright/test';
import {
  demoRows,
  prepareDemo,
  setColorDistribution,
  setDefaultColor,
  setPrintSpaceAround,
  setTemplate,
  settle,
} from '../support/demo-page';

const viewports = {
  small: { width: 1280, height: 1400 },
  large: { width: 1280, height: 3000 },
};

for (const template of ['small', 'large'] as const) {
  for (const distribution of ['indicator', 'card'] as const) {
    test.describe(`${template} / ${distribution}`, () => {
      test.use({ viewport: viewports[template] });

      test.beforeEach(async ({ page }) => {
        await prepareDemo(page);
        await setTemplate(page, template);
        await setColorDistribution(page, distribution);
        await settle(page);
      });

      test('screen', async ({ page }) => {
        const tiles = page.locator(tileSelector);
        for (const [i, row] of demoRows.entries()) {
          await expect(tiles.nth(i)).toHaveScreenshot(`${template}-${distribution}-tile-${row.replace(' ', '-')}.png`);
        }
      });

      for (const spaceAround of [true, false]) {
        // The first two tiles show the print styles and the spacing between tiles. Pagination is in print-pdf.spec.
        test(`print, space around ${spaceAround ? 'on' : 'off'}`, async ({ page }) => {
          await setPrintSpaceAround(page, spaceAround);
          await page.emulateMedia({ media: 'print' });
          await settle(page);
          await expect(page).toHaveScreenshot(
            `${template}-${distribution}-print-${spaceAround ? 'space' : 'no-space'}.png`,
            { clip: await firstTwoTiles(page, template) },
          );
        });
      }
    });
  }
}

// Fixed size from the first tile's corner: a clip computed from fractional tile boxes drifts by a pixel between runs.
const printClip = {
  small: { width: 744, height: 364 },
  large: { width: 856, height: 544 },
};

async function firstTwoTiles(page: Page, template: keyof typeof printClip) {
  const box = await page.locator(tileSelector).first().boundingBox();
  if (!box) throw new Error('first tile has no bounding box');
  const pad = 48;
  return { x: Math.max(0, Math.floor(box.x) - pad), y: Math.max(0, Math.floor(box.y) - pad), ...printClip[template] };
}

const printMarginRem = {
  small: { space: 2.2, noSpace: 0 },
  large: { space: 2.0, noSpace: 0 },
};

for (const template of ['small', 'large'] as const) {
  for (const spaceAround of [true, false]) {
    // B25: the large print rules targeted .tpl-large-ele, so large tiles kept their .8rem screen margin.
    test(`${template} print margin, space around ${spaceAround ? 'on' : 'off'}`, async ({ page }) => {
      await prepareDemo(page);
      await setTemplate(page, template);
      await setPrintSpaceAround(page, spaceAround);
      await page.emulateMedia({ media: 'print' });
      await settle(page);
      const marginRem = await page.locator(tileSelector).first().evaluate((tile) => {
        const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize);
        return parseFloat(getComputedStyle(tile).marginTop) / rootPx;
      });
      expect(marginRem).toBeCloseTo(printMarginRem[template][spaceAround ? 'space' : 'noSpace'], 2);
    });
  }
}

// B2: the previews were passed the string "{sequence, …}" instead of a shot, so they rendered empty.
test('Configuration previews show a sample tile (B2)', async ({ page }) => {
  await prepareDemo(page);
  const previews = page.locator('.configuration .preview');
  await expect(previews).toHaveCount(2);
  for (const preview of await previews.all()) {
    await expect(preview.locator('.sequence')).not.toBeEmpty();
    await expect(preview.locator('.action')).not.toBeEmpty();
  }
  await settle(page);
  await expect(page.locator('.configuration')).toHaveScreenshot('configuration.png');
});

// B24: Configuration showed printSpaceAround unset as checked while Tiles treated it as off, and the
// checkbox called preventDefault in onChange, so what it showed lagged the saved value.
test('print space around checkbox matches the tiles (B24)', async ({ page }) => {
  await prepareDemo(page);
  const checkbox = page.locator('#print-space-around');
  const tiles = page.locator('.tiles-container');
  await expect(checkbox).not.toBeChecked();
  await expect(tiles).toHaveClass(/print-no-space/);
  for (const on of [true, false, true]) {
    await checkbox.click();
    await expect(checkbox).toBeChecked({ checked: on });
    await expect(tiles).toHaveClass(on ? /print-space-around/ : /print-no-space/);
  }
});

for (const template of ['small', 'large'] as const) {
  test.describe(`${template} / default colour`, () => {
    test.use({ viewport: viewports[template] });

    test('rows without label use it', async ({ page }) => {
      await prepareDemo(page);
      await setTemplate(page, template);
      await setDefaultColor(page, '#3F51B5');
      await settle(page);
      const tiles = page.locator(tileSelector);
      for (const row of ['6', '7']) {
        await expect(tiles.nth(demoRows.indexOf(row))).toHaveScreenshot(`${template}-default-colour-tile-${row}.png`);
      }
    });
  });
}
