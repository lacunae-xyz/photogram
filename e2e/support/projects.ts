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

const mimeTypes: Record<string, string> = { '.jpg': 'image/jpeg', '.csv': 'text/csv' };

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

export async function expectCover(card: ReturnType<Page['locator']>, image: RegExp) {
  const cover = card.locator('.img-project-cover');
  await expect(cover).toHaveAttribute('src', image);
  await expect.poll(() => cover.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBeGreaterThan(0);
}

export const legacyProject = {
  key: 'legacy-project',
  name: 'Ancien projet',
  data: [
    { id: '1', sequence: '1', action: 'Premier plan', label: 'salon', periode: 'matin', fx: 'x', url: '/project/legacy-project/images/1.jpg/' },
    { id: '2', sequence: '2', action: 'Deuxième plan', label: '', periode: '', fx: '', url: '/project/legacy-project/images/2.jpg/' },
  ],
  colors: { salon: '#F44336' },
  template: 'small',
};

/** A project imported before Open project existed: JSON in `localStorage.projects`, images in Cache Storage. */
export async function seedLegacyProject(page: Page, { project = legacyProject, withImages = true } = {}) {
  await page.goto('/');
  const images = withImages
    ? ['1.jpg', '2.jpg'].map(name => ({ name, bytes: Array.from(fs.readFileSync(path.join(importFolder, name))) }))
    : [];
  await page.evaluate(
    async ({ project, images }) => {
      const projects = JSON.parse(localStorage.getItem('projects') ?? '[]');
      localStorage.setItem('projects', JSON.stringify([...projects, project]));
      if (images.length > 0) {
        const cache = await caches.open(`image-cache-${project.key}`);
        for (const image of images) {
          await cache.put(
            new Request(`/project/${project.key}/images/${image.name}/`),
            new Response(new Uint8Array(image.bytes), { headers: { 'Content-Type': 'image/jpeg' } }),
          );
        }
      }
    },
    { project, images },
  );
}
