import { Page } from '@playwright/test';
import { test, expect } from '../support/test';
import { routeDemo } from '../support/demo';
import { importProject } from '../support/projects';

test('robots.txt points at the sitemap and keeps crawlers out of projects', async ({ request }) => {
  const response = await request.get('/robots.txt');
  expect(response.ok()).toBe(true);
  const robots = await response.text();
  expect(robots).toContain('Sitemap: https://photogram.app/sitemap.xml');
  expect(robots).toContain('Disallow: /project/*');
});

test('every sitemap URL renders with a title', async ({ page, request }) => {
  const response = await request.get('/sitemap.xml');
  expect(response.ok()).toBe(true);
  const urls = [...(await response.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]));
  expect(urls.map(url => url.pathname).sort()).toEqual(
    ['/', '/privacy-policy', '/project-demo', '/projects', '/tutorial'].sort(),
  );
  for (const url of urls) {
    expect(url.origin).toBe('https://photogram.app');
    const document = await page.goto(url.pathname);
    expect(document?.status(), url.pathname).toBe(200);
    await expect.poll(() => page.title(), { message: url.pathname }).not.toBe('');
  }
});

const defaultMeta = {
  title: 'Photogram · A tool for editor assistants',
  description:
    'Create a board of photograms ready to print and cut. Reduce your time from two days to two seconds. Created by Thomas Heurtier & Nicolas Mouchel.',
};

const projectsMeta = {
  title: 'Photogram · Projects',
  description: 'Import or open a project folder, and find the projects stored in this browser.',
};

const routeMeta = [
  {
    path: '/',
    title: 'Photogram · A tool for editor assistants',
    description:
      'Create a board of photograms ready to print and cut, from a CSV file and your stills. Your projects stay on your device.',
  },
  {
    path: '/tutorial',
    title: 'Photogram · Comment utiliser Photogram',
    description: 'Préparer le tableau et les photogrammes de votre projet, puis les ajouter à Photogram',
  },
  { path: '/projects', ...projectsMeta },
  {
    path: '/project-demo',
    title: 'Photogram - Try the tool for assistant editors',
    description: 'Learn and play with our demo data set',
  },
  {
    path: '/privacy-policy',
    title: 'Photogram · Privacy policy',
    description: 'Photogram keeps your projects on your device. What it counts, and who hosts it.',
  },
  { path: '/does-not-exist', ...defaultMeta, title: 'Photogram · Page not found' },
];

async function expectMeta(page: Page, { title, description }: { title: string; description: string }) {
  await expect(page).toHaveTitle(title);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', description);
}

test('only the not found page asks not to be indexed', async ({ page }) => {
  await routeDemo(page);
  const robots = page.locator('meta[name="robots"]');
  await page.goto('/does-not-exist');
  await expect(robots).toHaveAttribute('content', 'noindex');
  for (const { path, ...meta } of routeMeta.filter(({ path }) => path !== '/does-not-exist')) {
    await page.goto(path);
    await expectMeta(page, meta);
    await expect(robots, path).toHaveCount(0);
  }
});

for (const { path, ...meta } of routeMeta) {
  test(`${path} has its title and description`, async ({ page }) => {
    await routeDemo(page);
    await page.goto(path);
    await expectMeta(page, meta);
  });
}

test('a project page has the default title and description, opened or reloaded', async ({ page }) => {
  const card = await importProject(page);
  await card.click();
  await expect(page).toHaveURL(/\/project\//);
  await expectMeta(page, defaultMeta);
  await page.reload();
  await expectMeta(page, defaultMeta);
  await page.goBack();
  await expectMeta(page, projectsMeta);
});
