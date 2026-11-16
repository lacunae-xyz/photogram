import { test, expect } from '../support/test';
import path from 'node:path';
import { fixtures } from '../support/demo';

const edl = (version: string) => path.join(fixtures, 'fixor', version);

test('compare two EDLs', async ({ page }) => {
  await page.goto('/fixor');
  await page.locator('#import-button').setInputFiles(edl('v1'));
  await expect(page.locator('#fixor-table tbody tr')).toHaveCount(3);
  await page.locator('#import-button').setInputFiles(edl('v2'));
  await expect(page.locator('.fixor-tool-header select').first()).toHaveValue('v2');

  await page.locator('#compare-button').selectOption('v1');
  const rows = page.locator('#fixor-table tbody tr');
  await expect(rows).toHaveCount(4);
  await expect(rows.locator('td:nth-child(2)')).toHaveText(['201_010201_010', '204_020', '208_050208_050', '301_010']);
  // B22: 208_050 changed its source out.
  await expect(rows.locator('td:first-child')).toHaveText(['modify', 'remove', 'modify', 'add']);

  const duration = (row: number) => rows.nth(row).locator('td').nth(4);
  // B6: no duration until an FPS is typed.
  await expect(page.locator('#fps-input')).toHaveValue('');
  await expect(duration(0)).toHaveText('––');
  await expect(duration(2)).toHaveText('––');
  await expect(duration(3)).toHaveText('–');

  await page.locator('#fps-input').fill('25');
  await expect(duration(0)).toHaveText('8282');
  await expect(duration(2)).toHaveText('6590');
  await expect(duration(3)).toHaveText('50');

  await page.mouse.move(0, 0);
  await expect(page.locator('#fixor-table')).toHaveScreenshot('fixor-compare.png');
});

test('the FPS label names the FPS input (B7)', async ({ page }) => {
  await page.goto('/fixor');
  await page.locator('#import-button').setInputFiles(edl('v1'));
  await expect(page.getByLabel('FPS')).toHaveId('fps-input');
  await expect(page.getByLabel('Compare')).toHaveId('compare-button');
});

test('Copy puts the table on the clipboard as HTML and text (B10)', async ({ page, context, pageErrors }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/fixor');
  await page.locator('#import-button').setInputFiles(edl('v1'));
  await expect(page.locator('#fixor-table tbody tr')).toHaveCount(3);

  await page.getByRole('button', { name: 'Copy' }).click();

  await expect
    .poll(() =>
      page.evaluate(async () => {
        const items = await navigator.clipboard.read();
        const read = (type: string) =>
          items[0]?.types.includes(type) ? items[0].getType(type).then(blob => blob.text()) : '';
        return { html: await read('text/html'), text: await read('text/plain') };
      }),
    )
    .toEqual({
      html: expect.stringMatching(/<table[^>]*id="fixor-table"[\s\S]*204_020/),
      text: expect.stringMatching(/id\timage\tdescription[\s\S]*204_020/),
    });
  expect(pageErrors).toEqual([]);
});

test('Copy fails quietly when the clipboard refuses (B10)', async ({ page, pageErrors, consoleErrors }) => {
  await page.addInitScript(() => {
    navigator.clipboard.write = () => Promise.reject(new DOMException('Write permission denied.', 'NotAllowedError'));
  });
  await page.goto('/fixor');
  await page.locator('#import-button').setInputFiles(edl('v1'));
  await expect(page.locator('#fixor-table tbody tr')).toHaveCount(3);

  await page.getByRole('button', { name: 'Copy' }).click();

  await expect.poll(() => consoleErrors).toEqual([expect.stringContaining('Could not copy the table')]);
  expect(pageErrors).toEqual([]);
  await expect(page.locator('#fixor-table tbody tr')).toHaveCount(3);
});
