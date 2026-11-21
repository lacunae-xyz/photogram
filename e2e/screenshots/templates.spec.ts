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

// Light and dark on screen. Print is always light: under the dark scheme it must match the light print baselines.
const schemes = ['light', 'dark'] as const;
const suffix = (scheme: (typeof schemes)[number]) => (scheme === 'dark' ? '-dark' : '');

// Rows with no shot: another baseline already shows them. Indicator rows 6 and 7 render as the card ones. Dark rows
// other than the labelled tile (1) and the theme background (6, 7) render as the light ones, title sizing included.
const unshotRows: Record<(typeof schemes)[number], Record<'indicator' | 'card', string[]>> = {
  light: { indicator: ['6', '7'], card: [] },
  dark: {
    indicator: ['2', '3', '4', '6', '7', '10', '11 bis'],
    card: ['2', '3', '4', '5', '8', '9', '10', '11 bis'],
  },
};

// Dark prints match the light baselines, so two of them are enough: both templates, both distributions, both spacings.
const printSpacings: Record<(typeof schemes)[number], Record<'small' | 'large', Record<'indicator' | 'card', boolean[]>>> = {
  light: { small: { indicator: [true, false], card: [true, false] }, large: { indicator: [true, false], card: [true, false] } },
  dark: { small: { indicator: [true], card: [] }, large: { indicator: [], card: [false] } },
};

for (const scheme of schemes) {
  for (const template of ['small', 'large'] as const) {
    for (const distribution of ['indicator', 'card'] as const) {
      test.describe(`${scheme} / ${template} / ${distribution}`, () => {
        test.use({ viewport: viewports[template], colorScheme: scheme });

        test.beforeEach(async ({ page }) => {
          await prepareDemo(page);
          await setTemplate(page, template);
          await setColorDistribution(page, distribution);
          await settle(page);
        });

        test('screen', async ({ page }) => {
          const tiles = page.locator(tileSelector);
          for (const [i, row] of demoRows.entries()) {
            if (unshotRows[scheme][distribution].includes(row)) continue;
            await expect(tiles.nth(i)).toHaveScreenshot(
              `${template}-${distribution}-tile-${row.replace(' ', '-')}${suffix(scheme)}.png`,
            );
          }
        });

        for (const spaceAround of printSpacings[scheme][template][distribution]) {
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

const printMarginPx = {
  small: { space: 22, noSpace: 0 },
  large: { space: 20, noSpace: 0 },
};

for (const template of ['small', 'large'] as const) {
  for (const spaceAround of [true, false]) {
    // B25: the large print rules targeted .tpl-large-ele, so large tiles kept their 8px screen margin.
    test(`${template} print margin, space around ${spaceAround ? 'on' : 'off'}`, async ({ page }) => {
      await prepareDemo(page);
      await setTemplate(page, template);
      await setPrintSpaceAround(page, spaceAround);
      await page.emulateMedia({ media: 'print' });
      await settle(page);
      const marginPx = await page
        .locator(tileSelector)
        .first()
        .evaluate((tile) => parseFloat(getComputedStyle(tile).marginTop));
      expect(marginPx).toBeCloseTo(printMarginPx[template][spaceAround ? 'space' : 'noSpace'], 1);
    });
  }
}

// B2: the previews were passed the string "{sequence, …}" instead of a shot, so they rendered empty.
for (const scheme of schemes) {
  test.describe(scheme, () => {
    test.use({ colorScheme: scheme });

    test('Configuration previews show a sample tile (B2)', async ({ page }) => {
      await prepareDemo(page);
      const previews = page.locator('.configuration .preview');
      await expect(previews).toHaveCount(2);
      for (const preview of await previews.all()) {
        await expect(preview.locator('.sequence')).not.toBeEmpty();
        await expect(preview.locator('.action')).not.toBeEmpty();
      }
      await settle(page);
      await expect(page.locator('.configuration')).toHaveScreenshot(`configuration${suffix(scheme)}.png`);
    });
  });
}

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
