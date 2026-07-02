import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import { apiLogin, seedLocalAuth, loginRef, REF_MENU } from './helpers';

/**
 * Menu / workflow-inventory parity between the deployed reference app
 * (djt-ev.web.app) and the local admin console. Read-only.
 */
test.describe('Parity: reference vs local', () => {
  test('local sidebar exposes every reference workflow', async ({ page, request }) => {
    const token = await apiLogin(request);
    await seedLocalAuth(page, token);
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'Users' })).toBeVisible();

    const missing: string[] = [];
    for (const item of REF_MENU) {
      const visible = await page
        .getByRole('button', { name: item, exact: true })
        .first()
        .isVisible()
        .catch(() => false);
      if (!visible) missing.push(item);
    }
    fs.writeFileSync('live-diagnostics-parity.json', JSON.stringify({ refMenu: REF_MENU, missingInLocal: missing }, null, 2));
    expect(missing, `local sidebar is missing: ${missing.join(', ')}`).toEqual([]);
  });

  test('reference app menu matches the captured inventory (best-effort)', async ({ page }) => {
    const ok = await loginRef(page);
    test.skip(!ok, 'reference-app login did not complete (network/creds) — skipping live menu diff');

    const clickables = await page.$$eval('a, button, [role="button"]', (els) =>
      [...new Set(els.map((e) => (e.textContent || '').replace(/\s+/g, ' ').trim()))]
    );
    const found = REF_MENU.filter((m) => clickables.some((c) => c === m));
    // The reference app should still show the same core workflows we recorded.
    expect(found.length, `reference menu items found: ${found.join(', ')}`).toBeGreaterThanOrEqual(REF_MENU.length - 2);
  });
});
