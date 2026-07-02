import { test, expect } from '@playwright/test';
import { apiLogin, seedLocalAuth } from './helpers';

/**
 * Verifies the Dashboard Time Range + Partner Organization filters are wired
 * end-to-end: the controls drive `/web/dashboard/analytics` with the right
 * query params, and the partner dropdown is populated from real data.
 * Read-only.
 */
test.describe('Dashboard filters (live)', () => {
  test('Time Range and Partner Organization drive the analytics request', async ({ page, request }) => {
    const token = await apiLogin(request);
    await seedLocalAuth(page, token);

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    // Initial analytics load (range=all).
    await page.waitForRequest((r) => r.url().includes('/web/dashboard/analytics'));

    // The dashboard has exactly two selects: [0] Time Range, [1] Partner Org.
    const combos = page.getByRole('combobox');
    await expect(combos.nth(0)).toBeVisible();

    // ── Time Range → Last 7 Days ──────────────────────────────────────────────
    const rangeReq = page.waitForRequest((r) =>
      r.url().includes('/web/dashboard/analytics') && /[?&]range=7d\b/.test(r.url())
    );
    await combos.nth(0).click();
    await page.getByRole('option', { name: 'Last 7 Days' }).click();
    await rangeReq;
    // Section title reflects the selection.
    await expect(page.getByText('Performance · Last 7 Days')).toBeVisible();

    // ── Partner Organization → a real partner (populated from /web/partners) ──
    await combos.nth(1).click();
    const options = page.getByRole('option');
    // Option 0 is "All Organizations"; option 1 is the first real partner.
    await expect(options.nth(1)).toBeVisible();
    const partnerReq = page.waitForRequest((r) =>
      r.url().includes('/web/dashboard/analytics') && /[?&]partnerId=\d+/.test(r.url())
    );
    await options.nth(1).click();
    const req = await partnerReq;
    expect(req.url()).toMatch(/partnerId=\d+/);
  });
});
