import { test as base, expect } from '@playwright/test';

// What an ad blocker does: Umami's script and its endpoint. analytics.spec serves both itself.
export const blockedHosts = ['cloud.umami.is', 'gateway.umami.is'];

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
