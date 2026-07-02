import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import { apiLogin, seedLocalAuth, SCREENS } from './helpers';

/**
 * Read-only smoke of every local workflow screen against the REAL backend.
 * For each screen we record: did the app shell survive, did a data grid render,
 * how many rows, any empty-state, backend 4xx/5xx, and console errors.
 * Results are written to live-diagnostics-screens.json for the report.
 */

type ScreenResult = {
  name: string;
  path: string;
  shell: boolean;
  hasGrid: boolean;
  rows: number;
  emptyState: boolean;
  badResponses: string[];
  consoleErrors: string[];
};

const results: ScreenResult[] = [];
let token = '';

test.beforeAll(async ({ request }) => {
  token = await apiLogin(request);
});

test.afterAll(() => {
  fs.writeFileSync('live-diagnostics-screens.json', JSON.stringify(results, null, 2));
});

test.describe('Local workflow screens (read-only)', () => {
  for (const s of SCREENS) {
    test(`renders: ${s.name} (${s.path})`, async ({ page }) => {
      await seedLocalAuth(page, token);

      const consoleErrors: string[] = [];
      const badResponses: string[] = [];
      page.on('console', (m) => {
        if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 180));
      });
      page.on('response', (r) => {
        if (r.url().includes('/api/') && r.status() >= 400) {
          badResponses.push(`${r.status()} ${new URL(r.url()).pathname.replace(/^\/api/, '')}`);
        }
      });

      await page.goto(s.path, { waitUntil: 'domcontentloaded' });

      // App shell (top bar) must survive — proves no white-screen crash.
      // waitFor retries while React mounts (isVisible() is a one-shot check).
      let shell = false;
      try {
        await page.locator('header').first().waitFor({ state: 'visible', timeout: 15000 });
        shell = true;
      } catch { /* stayed on /login or crashed */ }

      let hasGrid = false;
      let rows = 0;
      let emptyState = false;
      const grid = page.locator('.MuiDataGrid-root').first();
      try {
        await grid.waitFor({ state: 'visible', timeout: 10000 });
        hasGrid = true;
      } catch { /* not a grid screen, or it failed to render */ }
      if (hasGrid) {
        await page.waitForTimeout(2000); // let the fetch settle
        rows = await page.locator('.MuiDataGrid-row').count();
        emptyState = await page
          .getByText(/no rows|no data/i)
          .first()
          .isVisible()
          .catch(() => false);
      } else {
        await page.waitForTimeout(1500);
      }

      results.push({
        name: s.name,
        path: s.path,
        shell,
        hasGrid,
        rows,
        emptyState,
        badResponses: [...new Set(badResponses)],
        consoleErrors: [...new Set(consoleErrors)].slice(0, 5),
      });

      // Hard requirement: the screen must not white-screen.
      expect(shell, `${s.name} crashed the app shell`).toBeTruthy();
    });
  }
});
