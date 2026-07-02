import { defineConfig, devices } from '@playwright/test';

/**
 * LIVE config — side-by-side comparison of the local admin console
 * (localhost:3000, talking to the real djt-app backend on :5000) against the
 * deployed reference app (https://djt-ev.web.app).
 *
 * These tests hit a SHARED live database and a backend wired to LIVE payment
 * keys, so every spec here is strictly READ-ONLY: no creates, deletes, remote
 * start/stop, resets, blocks, or settlements.
 *
 * Credentials + reference URL are env-overridable; defaults come from
 * docs/DJT_ADMIN_INTEGRATION.md.
 */
export default defineConfig({
  testDir: './tests/live',
  testIgnore: '**/_*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'live-results.json' }], ['html', { open: 'never', outputFolder: 'playwright-report-live' }]],
  timeout: 90_000,

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  // Reuse the already-running dev server (which reads .env → API on :5000).
  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 180_000,
    env: { BROWSER: 'none' },
  },
});
