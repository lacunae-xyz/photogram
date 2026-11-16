import { test, expect } from '../support/test';
import { importProject, legacyProject, seedLegacyProject } from '../support/projects';
import { openFolder, openedName } from '../support/open-folder';

test('delete a legacy project', async ({ page }) => {
  await seedLegacyProject(page);
  await page.goto('/projects');
  const card = page.locator('.projects-card', { hasText: legacyProject.name });
  await card.locator('.btn-delete').click();
  await expect(card).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('projects'))).toBe('[]');
  expect(await page.evaluate(key => caches.has(`image-cache-${key}`), legacyProject.key)).toBe(false);
});

test('delete an imported project', async ({ page }) => {
  const card = await importProject(page);
  await card.locator('.btn-delete').click();
  await expect(card).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.projects-card')).toHaveCount(0);
});

test('delete a linked project', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'showDirectoryPicker is Chromium only');
  const card = await openFolder(page);
  await card.locator('.btn-delete').click();
  await expect(card).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.projects-card', { hasText: openedName })).toHaveCount(0);
});

test.describe('project without image cache (B1)', () => {
  test.beforeEach(async ({ page }) => {
    await seedLegacyProject(page, { withImages: false });
    await page.goto('/projects');
  });

  // B1: Images.clear rejects when there is no cache, so the list is not refreshed. Remove test.fail with the fix.
  test('card disappears', async ({ page }) => {
    test.fail();
    const card = page.locator('.projects-card', { hasText: legacyProject.name });
    await card.locator('.btn-delete').click();
    await expect(card).toHaveCount(0, { timeout: 2_000 });
  });

  test('project is gone after reload', async ({ page }) => {
    const card = page.locator('.projects-card', { hasText: legacyProject.name });
    await card.locator('.btn-delete').click();
    await page.reload();
    await expect(page.locator('#grid')).toBeAttached();
    await expect(card).toHaveCount(0);
  });
});
