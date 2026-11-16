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
  await expect(rows.locator('td:nth-child(2)')).toHaveText(['201_010201_010', '204_020', '208_050', '301_010']);
  // 208_050 changed its source out, but compare stringifies timecodes as "[object Object]". Not in 04 yet.
  await expect(rows.locator('td:first-child')).toHaveText(['modify', 'remove', 'identity', 'add']);

  const duration = (row: number) => rows.nth(row).locator('td').nth(4);
  // B6: durations show "NaN" until an FPS is typed. After the fix they show "–".
  await expect(duration(0)).toHaveText('NaNNaN');
  await expect(duration(2)).toHaveText('NaN');

  await page.locator('#fps-input').fill('25');
  await expect(duration(0)).toHaveText('8282');
  await expect(duration(2)).toHaveText('90');
  await expect(duration(3)).toHaveText('50');

  await page.mouse.move(0, 0);
  await expect(page.locator('#fixor-table')).toHaveScreenshot('fixor-compare.png');
});
