import { test, expect } from '../support/test';
import { expectCover, legacyProject, seedLegacyProject, waitForServiceWorker } from '../support/projects';

test('legacy localStorage project: listed with cover, opens, edit survives reload', async ({ page }) => {
  await seedLegacyProject(page);
  await page.goto('/projects');
  await waitForServiceWorker(page);
  const card = page.locator('.projects-card', { hasText: legacyProject.name });
  await expectCover(card, /^\/project\/legacy-project\/images\/1\.jpg\/$/);

  await card.click();
  await expect(page).toHaveURL(/\/project\/legacy-project$/);
  const tiles = page.locator('.tiles-container .ele');
  await expect(tiles).toHaveCount(legacyProject.data.length);

  await tiles.first().click();
  await page.locator('#form-action').fill('Plan modifié');
  await page.locator('#form button[type=submit]').click();
  await expect(tiles.first().locator('.action')).toHaveText('Plan modifié');

  await page.reload();
  await expect(tiles.first().locator('.action')).toHaveText('Plan modifié');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('projects') ?? '[]'));
  expect(stored).toHaveLength(1);
  expect(stored[0].key).toBe('legacy-project');
  expect(stored[0].data[0].action).toBe('Plan modifié');
});
