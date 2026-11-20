import type { Page } from '@playwright/test';
import { test, expect, tileSelector } from '../support/test';
import { routeDemo } from '../support/demo';
import { openFolder } from '../support/open-folder';
import { importProject, importRows } from '../support/projects';

const routes = [
  { path: '/', ready: '.landing-container' },
  { path: '/tutorial', ready: 'h1' },
  { path: '/projects', ready: '.projects-container' },
  { path: '/project-demo', ready: tileSelector },
  { path: '/privacy-policy', ready: 'h1' },
];

for (const { path, ready } of routes) {
  test(`${path} renders with no console errors`, async ({ page, consoleErrors, pageErrors }) => {
    await page.goto(path);
    await expect(page.locator(ready).first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}

// React 19's element type, in React's own code. Photogram has no React since Fixor left (07).
const reactMarker = 'react.transitional.element';

for (const { path, ready } of routes) {
  test(`${path} does not load React`, async ({ page, baseURL }) => {
    const { origin } = new URL(baseURL!);
    const scripts: Promise<string>[] = [];
    page.on('response', response => {
      if (response.request().resourceType() === 'script' && new URL(response.url()).origin === origin) {
        scripts.push(response.text());
      }
    });
    await page.goto(path);
    await expect(page.locator(ready).first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    const bodies = await Promise.all(scripts);
    expect(bodies.length).toBeGreaterThan(0);
    expect(bodies.some(body => body.includes(reactMarker))).toBe(false);
  });
}

test('the privacy policy is linked from /', async ({ page }) => {
  await page.goto('/');
  await markWindow(page);
  await page.getByRole('link', { name: 'Privacy policy' }).click();
  await expect(page).toHaveURL(/\/privacy-policy$/);
  expect(await windowMarked(page)).toBe(true);
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy policy' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'contact@lacunae.xyz' })).toHaveAttribute('href', 'mailto:contact@lacunae.xyz');
});

test('the tutorial names the file data.csv', async ({ page }) => {
  await page.goto('/tutorial');
  await expect(page.getByText('nommé data.csv')).toBeVisible();
});

// B16: there was no catch-all route, an unknown URL rendered an empty app.
test('unknown route shows a not found page (B16)', async ({ page, pageErrors }) => {
  const response = await page.goto('/does-not-exist');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: /not found|404/i })).toBeVisible({ timeout: 2_000 });
  expect(pageErrors).toEqual([]);
});

/** Sets a marker on `window`: a full page load drops it. */
async function markWindow(page: Page) {
  await page.evaluate(() => Object.assign(window, { photogramMarker: true }));
}

async function windowMarked(page: Page) {
  return page.evaluate(() => 'photogramMarker' in window);
}

const headerLink = (page: Page, name: string) => page.getByRole('navigation').getByRole('link', { name });

test('Projects → Tutorial navigates without loading the page', async ({ page, pageErrors }) => {
  await page.goto('/projects');
  await expect(page.locator('#import-project-label')).toBeVisible();
  await markWindow(page);
  await headerLink(page, 'Tutorial').click();
  await expect(page).toHaveURL(/\/tutorial$/);
  await expect(page.getByText('nommé data.csv')).toBeVisible();
  await expect(page).toHaveTitle('Photogram · Comment utiliser Photogram');
  expect(await windowMarked(page)).toBe(true);
  expect(pageErrors).toEqual([]);
});

test('back and forward show the page of the address, without loading it', async ({ page }) => {
  await page.goto('/projects');
  await expect(page.locator('#import-project-label')).toBeVisible();
  await markWindow(page);
  await headerLink(page, 'Tutorial').click();
  await expect(page.getByText('nommé data.csv')).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.locator('#import-project-label')).toBeVisible();
  await expect(page).toHaveTitle('Photogram · Projects');

  await page.goForward();
  await expect(page).toHaveURL(/\/tutorial$/);
  await expect(page.getByText('nommé data.csv')).toBeVisible();
  await expect(page).toHaveTitle('Photogram · Comment utiliser Photogram');
  expect(await windowMarked(page)).toBe(true);
});

// A load made screen readers read the new page. In-app navigation was silent.
test('in-app navigation reads the title of the new page', async ({ page }) => {
  await page.goto('/projects');
  await expect(page.locator('#import-project-label')).toBeVisible();
  const status = page.locator('photogram-app').getByRole('status');
  await expect(status).toHaveText('');

  await headerLink(page, 'Tutorial').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('nommé data.csv')).toBeVisible();
  await expect(status).toHaveText('Photogram · Comment utiliser Photogram');
  // As after a load, the next Tab starts from the top of the new page.
  await page.keyboard.press('Tab');
  await expect(page.locator('pg-header a.home')).toBeFocused();

  await page.goBack();
  await expect(page.locator('#import-project-label')).toBeVisible();
  await expect(status).toHaveText('Photogram · Projects');
});

test('a modified click on a header link opens it in a new page', async ({ page, context }) => {
  await page.goto('/projects');
  await expect(page.locator('#import-project-label')).toBeVisible();
  const opened = context.waitForEvent('page');
  await headerLink(page, 'Tutorial').click({ modifiers: ['ControlOrMeta'] });
  const tutorial = await opened;
  await expect(tutorial).toHaveURL(/\/tutorial$/);
  await expect(tutorial.getByText('nommé data.csv')).toBeVisible();
  await expect(page).toHaveURL(/\/projects$/);
});

test('routes without a native URLPattern', async ({ page, pageErrors }) => {
  await page.addInitScript(() => {
    delete (globalThis as { URLPattern?: unknown }).URLPattern;
  });
  await page.goto('/Tutorial/');
  await expect(page.getByText('nommé data.csv')).toBeVisible();
  await headerLink(page, 'Projects').click();
  await expect(page.locator('#import-project-label')).toBeVisible();
  await page.goto('/does-not-exist');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

// Fixor iframes photogram.app/fixor until phase 7. Only meaningful against Netlify (BASE_URL), `serve` sends no such headers.
test('/fixor can be framed by fixor.photogram.app', async ({ request }) => {
  const response = await request.get('/fixor');
  expect(response.ok()).toBe(true);
  const headers = response.headers();
  expect(headers['x-frame-options']).toBeUndefined();
  const frameAncestors = headers['content-security-policy']
    ?.split(';')
    .map(directive => directive.trim())
    .find(directive => directive.startsWith('frame-ancestors'));
  if (frameAncestors !== undefined) {
    expect(frameAncestors).toContain('https://fixor.photogram.app');
  }
});

type Illustration = { name: string | null; loaded: boolean };

/** Every pg-illustration on the page, in document order, and whether its image has loaded. */
function illustrations(page: Page) {
  return page.locator('pg-illustration').evaluateAll(elements =>
    elements.map(element => {
      const image = element.shadowRoot?.querySelector('img');
      return { name: element.getAttribute('name'), loaded: !!image && image.complete && image.naturalWidth > 0 };
    }),
  );
}

async function expectIllustrations(page: Page, names: string[]) {
  const expected: Illustration[] = names.map(name => ({ name, loaded: true }));
  await expect.poll(() => illustrations(page)).toEqual(expected);
}

// B11: the landing loaded an illustration from a relative URL, which only resolved on `/`.
const routeIllustrations = [
  {
    path: '/',
    names: ({ chromium }: { chromium: boolean }) => [
      'learning',
      'upload-image',
      ...(chromium ? ['folder'] : []),
      'presentation',
      'web-developer',
      'videographer',
    ],
  },
  { path: '/tutorial', names: () => ['editable', 'the-search'] },
  { path: '/projects', names: () => ['empty-street'] },
  { path: '/project-demo', names: () => [] },
  { path: '/privacy-policy', names: () => [] },
];

for (const { path, names } of routeIllustrations) {
  test(`${path} loads its illustrations (B11)`, async ({ page, browserName }) => {
    await routeDemo(page);
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await expectIllustrations(page, names({ chromium: browserName === 'chromium' }));
  });
}

test('/project/:id loads its illustrations (B11)', async ({ page }) => {
  const card = await importProject(page);
  await card.click();
  await expect(page).toHaveURL(/\/project\/[\w-]+$/);
  await expect(page.locator(tileSelector)).toHaveCount(importRows);
  await expectIllustrations(page, []);
});

test('/project/:id loads the permission illustration (B11)', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'showDirectoryPicker is Chromium only');
  const card = await openFolder(page);
  await card.click();
  await expect(page).toHaveURL(/\/project\/[\w-]+$/);
  // As open-folder.spec: the permission is back to prompt after the reload.
  await page.addInitScript(() => {
    const prototype = FileSystemHandle.prototype as FileSystemHandle & {
      queryPermission(): Promise<PermissionState>;
    };
    prototype.queryPermission = async () => 'prompt';
  });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Grant permission' })).toBeVisible();
  await expectIllustrations(page, ['private-files']);
});

// Leaving a page while its illustration loads fails the import in WebKit. Stale chunks after a deploy fail it too.
test('an illustration that fails to load leaves the page without errors', async ({ page, pageErrors }) => {
  await page.route('**/assets/empty-street-*.js', route => route.abort());
  await page.goto('/projects');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('#import-project-label')).toBeVisible();
  expect(await illustrations(page)).toEqual([{ name: 'empty-street', loaded: false }]);
  expect(pageErrors).toEqual([]);
});
