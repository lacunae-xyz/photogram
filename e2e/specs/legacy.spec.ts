import { test, expect } from '../support/test';
import {
  createLegacyProject,
  expectCover,
  legacyKey,
  legacyProject,
  seedLegacyProject,
  seedLegacyProjects,
  storedProjectKeys,
  waitForServiceWorker,
} from '../support/projects';

test('legacy localStorage project: migrated to IndexedDB, opens, edit survives reload', async ({ page, browserName }) => {
  await seedLegacyProject(page);
  await page.goto('/projects');
  await waitForServiceWorker(page);
  const card = page.locator('.projects-card', { hasText: legacyProject.name });
  await expectCover(card, /^\/project\/legacy-project\/images\/1\.jpg\/$/, { served: browserName === 'chromium' });
  expect(await legacyKey(page)).toBeNull();
  expect(await storedProjectKeys(page)).toEqual(['legacy-project']);

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

  await page.goto('/projects');
  await expect(card).toHaveCount(1);
  await page.reload();
  await expect(card).toHaveCount(1);
  await expect(page.locator('.projects-card')).toHaveCount(1);
  expect(await legacyKey(page)).toBeNull();
});

test('legacy migration failing once: key kept, next start completes', async ({ page, browserName }) => {
  // The second IndexedDB put of the first start throws, as a full disk would.
  await page.addInitScript(() => {
    let puts = 0;
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args: Parameters<typeof put>) {
      if (!sessionStorage.getItem('put-failed') && localStorage.getItem('projects') && ++puts === 2) {
        sessionStorage.setItem('put-failed', 'true');
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      }
      return put.apply(this, args);
    };
  });
  const projects = [
    createLegacyProject('legacy-a', 'Projet A'),
    createLegacyProject('legacy-b', 'Projet B'),
    createLegacyProject('legacy-c', 'Projet C'),
  ];
  await seedLegacyProjects(page, projects);

  await page.goto('/projects');
  await expect(page.locator('.projects-card')).toHaveCount(2);
  expect(await legacyKey(page)).not.toBeNull();

  await page.reload();
  await waitForServiceWorker(page);
  await expect(page.locator('.projects-card')).toHaveCount(3);
  for (const project of projects) {
    const card = page.locator('.projects-card', { hasText: project.name });
    await expect(card).toHaveCount(1);
    await expectCover(card, new RegExp(`^/project/${project.key}/images/1\\.jpg/$`), {
      served: browserName === 'chromium',
    });
  }
  expect(await legacyKey(page)).toBeNull();
  expect((await storedProjectKeys(page)).sort()).toEqual(['legacy-a', 'legacy-b', 'legacy-c']);
});
