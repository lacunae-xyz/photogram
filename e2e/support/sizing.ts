import { expect, Page } from '@playwright/test';

/**
 * Waits until title sizing (src/Templates/titleSizing.ts) is done: the fonts have loaded, and every `.action` has an
 * inline font-size that holds across two frames. Sizing waits for loading fonts too, so a size seen here was measured
 * in the loaded font. Holds until the Lit port changes the sizing (06 §6.5 item 7).
 */
export async function waitForTitleSizing(page: Page, timeout = 30_000) {
  await expect
    .poll(
      () =>
        page.locator('.action').evaluateAll(async nodes => {
          if (nodes.length === 0) {
            return 'no .action';
          }
          await document.fonts.ready;
          if (document.fonts.status !== 'loaded') {
            return 'fonts loading';
          }
          const sizes = () => nodes.map(node => (node as HTMLElement).style.fontSize);
          const before = sizes();
          if (before.some(size => size === '')) {
            return '.action without inline font-size';
          }
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          const after = sizes();
          return before.every((size, i) => size === after[i]) ? 'stable' : 'still sizing';
        }),
      { timeout, intervals: [100, 250, 500] },
    )
    .toBe('stable');
}

/** Every `<img>`, including the ones in shadow roots, which `document.images` doesn't list. */
export async function waitForImages(page: Page, timeout = 30_000) {
  await expect
    .poll(() => page.locator('img').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete)), {
      timeout,
    })
    .toBe(true);
}
