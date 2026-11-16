import { Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

export const fixtures = path.join(import.meta.dirname, '..', 'fixtures');

type DemoContent = {
  csv: string;
  image: (name: string) => Buffer | undefined;
};

export function fixtureDemo(): DemoContent {
  const dir = path.join(fixtures, 'demo');
  return {
    csv: fs.readFileSync(path.join(dir, 'data.csv'), 'utf8'),
    image: name => {
      const file = path.join(dir, name);
      return fs.existsSync(file) ? fs.readFileSync(file) : undefined;
    },
  };
}

/** `/project-demo` reads `/demo/data.csv` and `/demo/<id>.jpg`. The project lives in memory only. */
export async function routeDemo(page: Page, content: DemoContent = fixtureDemo()) {
  await page.route('**/demo/**', route => {
    const name = decodeURIComponent(new URL(route.request().url()).pathname.replace(/^\/demo\//, ''));
    if (name === 'data.csv') {
      return route.fulfill({ contentType: 'text/csv', body: content.csv });
    }
    const image = content.image(name);
    return image
      ? route.fulfill({ contentType: 'image/jpeg', body: image })
      : route.fulfill({ status: 404, body: '' });
  });
}
