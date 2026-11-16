import { expect, Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fixtures } from './demo';

export const importFolder = path.join(fixtures, 'import', 'Projet import');
export const importRows = 3;

export async function waitForServiceWorker(page: Page) {
  await page.waitForFunction(async () => {
    await navigator.serviceWorker.ready;
    return navigator.serviceWorker.controller !== null;
  });
}

const mimeTypes: Record<string, string> = { '.jpg': 'image/jpeg', '.csv': 'text/csv', '.json': 'application/json' };

/**
 * Playwright's Firefox directory upload gives every file an empty MIME type, which a real picker doesn't.
 * There, build the FileList by hand with `webkitRelativePath` set, as the picker would.
 */
async function uploadFolder(page: Page, input: string, folder: string) {
  if (page.context().browser()?.browserType().name() !== 'firefox') {
    await page.locator(input).setInputFiles(folder);
    return;
  }
  const files = fs.readdirSync(folder).map(name => ({
    name,
    type: mimeTypes[path.extname(name)] ?? '',
    path: `${path.basename(folder)}/${name}`,
    bytes: Array.from(fs.readFileSync(path.join(folder, name))),
  }));
  await page.locator(input).evaluate((element: HTMLInputElement, files) => {
    const transfer = new DataTransfer();
    for (const file of files) {
      const blob = new File([new Uint8Array(file.bytes)], file.name, { type: file.type });
      Object.defineProperty(blob, 'webkitRelativePath', { value: file.path });
      transfer.items.add(blob);
    }
    element.files = transfer.files;
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }, files);
}

export async function importProject(page: Page, folder = importFolder) {
  await page.goto('/projects');
  await waitForServiceWorker(page);
  await uploadFolder(page, '#import-project-file', folder);
  const card = page.locator('.projects-card', { hasText: path.basename(folder) });
  await expect(card).toBeVisible();
  return card;
}

/**
 * `served: false` checks the src only. Under Playwright, Firefox and WebKit pages reached by navigation or reload
 * aren't reliably controlled by image-worker.js (Firefox reports no controller after a reload).
 */
export async function expectCover(card: ReturnType<Page['locator']>, image: RegExp, { served = true } = {}) {
  const cover = card.locator('.img-project-cover');
  await expect(cover).toHaveAttribute('src', image);
  if (!served) {
    return;
  }
  await expect.poll(() => cover.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBeGreaterThan(0);
}

export function createLegacyProject(key: string, name: string) {
  return {
    key,
    name,
    data: [
      { id: '1', sequence: '1', action: 'Premier plan', label: 'salon', periode: 'matin', fx: 'x', url: `/project/${key}/images/1.jpg/` },
      { id: '2', sequence: '2', action: 'Deuxième plan', label: '', periode: '', fx: '', url: `/project/${key}/images/2.jpg/` },
    ],
    colors: { salon: '#F44336' },
    template: 'small',
  };
}

export const legacyProject = createLegacyProject('legacy-project', 'Ancien projet');

type LegacyProject = ReturnType<typeof createLegacyProject>;

/**
 * Projects imported by older releases: JSON in `localStorage.projects`, images in Cache Storage.
 * The app reads the key synchronously on start, so the page has already looked for it when this writes it.
 */
export async function seedLegacyProjects(page: Page, projects: LegacyProject[], { withImages = true } = {}) {
  await page.goto('/projects');
  // Later navigations then start controlled by image-worker.js, which serves the covers.
  await waitForServiceWorker(page);
  const images = withImages
    ? ['1.jpg', '2.jpg'].map(name => ({ name, bytes: Array.from(fs.readFileSync(path.join(importFolder, name))) }))
    : [];
  await page.evaluate(
    async ({ projects, images }) => {
      localStorage.setItem('projects', JSON.stringify(projects));
      for (const project of projects) {
        if (images.length > 0) {
          const cache = await caches.open(`image-cache-${project.key}`);
          for (const image of images) {
            await cache.put(
              new Request(`/project/${project.key}/images/${image.name}/`),
              new Response(new Uint8Array(image.bytes), { headers: { 'Content-Type': 'image/jpeg' } }),
            );
          }
        }
      }
    },
    { projects, images },
  );
}

export async function seedLegacyProject(page: Page, { project = legacyProject, withImages = true } = {}) {
  await seedLegacyProjects(page, [project], { withImages });
}

export async function legacyKey(page: Page) {
  return page.evaluate(() => localStorage.getItem('projects'));
}

/** Keys in the app's IndexedDB store. Call it once the app has opened the database. */
export async function storedProjectKeys(page: Page) {
  return page.evaluate(
    () =>
      new Promise<string[]>((resolve, reject) => {
        const request = indexedDB.open('projects');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const keys = db.transaction('store').objectStore('store').getAllKeys();
          keys.onerror = () => reject(keys.error);
          keys.onsuccess = () => {
            db.close();
            resolve(keys.result as string[]);
          };
        };
      }),
  );
}

/** A project as stored in the app's IndexedDB store, to wait for a save before reloading. */
export async function storedProject(page: Page, key: string) {
  return page.evaluate(
    key =>
      new Promise<Record<string, unknown> | undefined>((resolve, reject) => {
        const request = indexedDB.open('projects');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const entry = db.transaction('store').objectStore('store').get(key);
          entry.onerror = () => reject(entry.error);
          entry.onsuccess = () => {
            db.close();
            resolve(entry.result?.data);
          };
        };
      }),
    key,
  );
}
