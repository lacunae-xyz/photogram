import { test, expect } from '../support/test';
import path from 'node:path';
import { Page } from '@playwright/test';
import { fixtures } from '../support/demo';
import { importProject } from '../support/projects';

type Send = { type: string; payload: { website?: string; url?: string; referrer?: string; name?: string } };

const uuid = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

/** Serves the pinned Umami script, records what it sends, and lets it run on localhost. */
async function routeUmami(page: Page) {
  const sends: Send[] = [];
  // Registered first, so the Umami routes below take precedence.
  await page.route('**/*', async route => {
    if (route.request().resourceType() !== 'document') {
      return route.fallback();
    }
    const response = await route.fetch();
    const body = (await response.text()).replace(/ data-domains="[^"]*"/, '');
    return route.fulfill({ response, body });
  });
  await page.route('https://cloud.umami.is/script.js', route =>
    route.fulfill({ path: path.join(fixtures, 'umami-script.js'), contentType: 'text/javascript' }),
  );
  await page.route('**/api/send', route => {
    sends.push(route.request().postDataJSON());
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  return sends;
}

test('page views and events reach Umami without project ids', async ({ page }) => {
  const sends = await routeUmami(page);
  const pageViews = () => sends.filter(send => send.type === 'event' && !send.payload.name);
  const events = () => sends.filter(send => send.payload.name).map(send => send.payload.name);

  const card = await importProject(page);
  const urls = () => pageViews().map(send => send.payload.url);
  await expect.poll(urls).toContainEqual(expect.stringMatching(/\/projects$/));
  await expect.poll(events).toContain('project-create');

  await card.click();
  await expect(page).toHaveURL(/\/project\/[\w-]+$/);
  await expect.poll(urls).toContainEqual(expect.stringMatching(/\/project\/\{id\}$/));

  await page.locator('.toolbar .button-close').click();
  await expect.poll(events).toContain('project-back');

  expect(sends.every(send => send.payload.website)).toBe(true);
  expect(JSON.stringify(sends)).not.toMatch(uuid);
});

test('the app works with Umami blocked', async ({ page, pageErrors }) => {
  const card = await importProject(page);
  await card.click();
  await expect(page.locator('.tiles-container .ele')).toHaveCount(3);
  expect(await page.evaluate(() => 'umami' in window)).toBe(false);
  expect(pageErrors).toEqual([]);
});
