import { expect } from '@playwright/test';
import { test as base } from './coverage';

// What an ad blocker does: Umami's script and its endpoint. analytics.spec serves both itself.
export const blockedHosts = ['sagix-umami.netlify.app', 'analytics.lacunae.xyz'];

export const tileSelector = '.tiles-container > :is(photogram-tile-small, photogram-tile-large)';

const isBlocked = (url: string) => blockedHosts.some(host => url.includes(`//${host}/`));

type Fixtures = {
  blockThirdParties: void;
  consoleErrors: string[];
  pageErrors: Error[];
};

export const test = base.extend<Fixtures>({
  blockThirdParties: [
    async ({ context }, use) => {
      for (const host of blockedHosts) {
        await context.route(`**/${host}/**`, route => route.abort());
      }
      await use();
    },
    { auto: true },
  ],
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('console', message => {
      if (message.type() === 'error' && !isBlocked(message.location().url) && !isBlocked(message.text())) {
        errors.push(message.text());
      }
    });
    await use(errors);
  },
  pageErrors: async ({ page }, use) => {
    const errors: Error[] = [];
    page.on('pageerror', error => errors.push(error));
    await use(errors);
  },
});

export { expect };
