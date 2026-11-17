import type { Page } from '@playwright/test';
import path from 'node:path';

/** The design system's gallery page, in the build. */
export const galleryUrl = '/packages/design-system/';

/**
 * Serves the gallery's HTML from the build. `serve -s` answers a directory with the app's index.html, where Netlify
 * serves the directory's own: the page's scripts and styles are under /assets, served as they are.
 */
export async function routeGallery(page: Page) {
  await page.route(`**${galleryUrl}`, route =>
    route.fulfill({ path: path.join(import.meta.dirname, '../../dist/packages/design-system/index.html') }),
  );
}
