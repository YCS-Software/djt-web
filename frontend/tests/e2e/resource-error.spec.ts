import { test, expect } from '@playwright/test';
import { installApiMocks, seedAuth } from './helpers';

/**
 * Regression test for the ResourceListPage load-error + Retry enhancement:
 * a failed list fetch must show an error (not a silent empty table), and Retry
 * must recover. The Connectors screen is a config-driven ResourceListPage that
 * fetches `/web/stations`.
 */
test.describe('ResourceListPage — load error & retry', () => {
  test('shows an error with Retry on a failed fetch, then recovers', async ({ page }) => {
    await seedAuth(page);
    await installApiMocks(page);

    // Fail the first stations fetch, succeed afterwards.
    let attempts = 0;
    await page.route('**/api/web/stations**', async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      attempts += 1;
      if (attempts === 1) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Failed to load data' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ rows: [{ id: 's-1', name: 'CP-1', station: 'Location A', status: 'available' }] }),
      });
    });

    await page.goto('/connectors');

    // Error surfaced with a Retry action.
    await expect(page.getByRole('alert')).toContainText(/failed to load/i);
    await page.getByRole('button', { name: 'Retry' }).click();

    // Recovered: row visible, error banner gone.
    await expect(page.getByText('CP-1')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
});
