import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL ?? 'http://localhost:5000';
const ci = !!process.env.CI;

export default defineConfig({
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}-{projectName}{ext}',
  // Baselines come from the Playwright Docker image (./docker.sh), never from a host run.
  updateSnapshots: process.env.PLAYWRIGHT_DOCKER ? 'missing' : 'none',
  fullyParallel: true,
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  reporter: ci ? [['list'], ['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      // The default 0.2 let a one-step grey shift (silver to #aaa borders) through: §6.5 colour changes must fail here.
      threshold: 0.05,
      animations: 'disabled',
      caret: 'hide',
    },
  },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'npx serve -s ../dist -l 5000 --no-request-logging',
        url: baseURL,
        reuseExistingServer: !ci,
      },
  projects: [
    {
      name: 'screenshots',
      testDir: './screenshots',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 1400 },
        deviceScaleFactor: 1,
        serviceWorkers: 'block',
      },
    },
    {
      name: 'perf',
      testDir: './perf',
      retries: 0,
      fullyParallel: false,
      grepInvert: process.env.PERF_SLOW ? undefined : /@slow/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
        serviceWorkers: 'block',
        // Trace snapshots run in the page on every action and serialise each shadow root's styles: on 1000 tiles they add long tasks to the measure.
        trace: 'off',
      },
    },
    {
      name: 'e2e',
      testDir: './specs',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'e2e-firefox',
      testDir: './specs',
      testMatch: /(import|open-folder|edit|legacy|routes)\.spec\.ts/,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'e2e-webkit',
      testDir: './specs',
      testMatch: /(import|open-folder|edit|legacy|routes)\.spec\.ts/,
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
