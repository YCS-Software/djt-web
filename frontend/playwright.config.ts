import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E config for the DJT EV admin console.
 *
 * The app is a CRA dev server on :3000. Tests run fully offline — every
 * `/api/**` request is intercepted and mocked (see tests/e2e/helpers.ts), so
 * no djt-app backend needs to be running. To keep the API same-origin (and
 * avoid CORS preflight on POSTs), we point REACT_APP_API_URL at :3000/api and
 * fulfill those routes in the browser.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      BROWSER: 'none',
      REACT_APP_API_URL: 'http://localhost:3000/api',
    },
  },
});
