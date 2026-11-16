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
