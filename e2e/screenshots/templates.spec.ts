import { test, expect } from '../support/test';
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
        const tiles = page.locator('.tiles-container .ele');
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
  const box = await page.locator('.tiles-container .ele').first().boundingBox();
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
    test(`${template} print margin, space around ${spaceAround ? 'on' : 'off'}`, async ({ page }) => {
      // B25: the large print rules target .tpl-large-ele, so tiles keep their .8rem screen margin.
      test.fail(template === 'large', 'B25');
      await prepareDemo(page);
      await setTemplate(page, template);
      await setPrintSpaceAround(page, spaceAround);
      await page.emulateMedia({ media: 'print' });
      await settle(page);
      const marginRem = await page.locator('.tiles-container .ele').first().evaluate((tile) => {
        const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize);
        return parseFloat(getComputedStyle(tile).marginTop) / rootPx;
      });
      expect(marginRem).toBeCloseTo(printMarginRem[template][spaceAround ? 'space' : 'noSpace'], 2);
    });
  }
}

// Configuration shows printSpaceAround unset as checked while Tiles treats it as off, and the checkbox
// calls preventDefault in onChange, so what it shows lags the saved value (B24).
test('print space around checkbox is out of sync with the tiles', async ({ page }) => {
  await prepareDemo(page);
  const checkbox = page.locator('#print-space-around');
  const tiles = page.locator('.tiles-container');
  const states = [];
  for (let clicks = 0; clicks < 4; clicks++) {
    await page.waitForTimeout(300);
    states.push([await checkbox.isChecked(), (await tiles.getAttribute('class'))?.replace('tiles-container ', '')]);
    await checkbox.click();
  }
  expect(states).toEqual([
    [true, 'print-no-space'],
    [true, 'print-no-space'],
    [false, 'print-no-space'],
    [false, 'print-space-around'],
  ]);
});

for (const template of ['small', 'large'] as const) {
  test.describe(`${template} / default colour`, () => {
    test.use({ viewport: viewports[template] });

    test('rows without label use it', async ({ page }) => {
      await prepareDemo(page);
      await setTemplate(page, template);
      await setDefaultColor(page, '#3F51B5');
      await settle(page);
      const tiles = page.locator('.tiles-container .ele');
      for (const row of ['6', '7']) {
        await expect(tiles.nth(demoRows.indexOf(row))).toHaveScreenshot(`${template}-default-colour-tile-${row}.png`);
      }
    });
  });
}
