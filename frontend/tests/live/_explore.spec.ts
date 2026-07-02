import { test } from '@playwright/test';
import { REF_BASE as REF, EMAIL, PASSWORD, requireCreds } from './helpers';

// One-off discovery run. Not part of the suite semantics — just prints the
// reference app's DOM so we can author real selectors. Run:
//   npx playwright test _explore --config=playwright.live.config.ts
test('explore reference app', async ({ page }) => {
  requireCreds();
  await page.goto(REF, { waitUntil: 'networkidle' });
  console.log('URL:', page.url());
  console.log('TITLE:', await page.title());

  const dump = async (label: string) => {
    const inputs = await page.$$eval('input', (els) =>
      els.map((e) => ({ type: e.getAttribute('type'), name: e.getAttribute('name'), id: e.id, ph: e.getAttribute('placeholder'), aria: e.getAttribute('aria-label') }))
    );
    const buttons = await page.$$eval('button, [role="button"], a', (els) =>
      els.map((e) => (e.textContent || '').trim()).filter((t) => t && t.length < 40)
    );
    console.log(`\n===== ${label} =====`);
    console.log('URL:', page.url());
    console.log('INPUTS:', JSON.stringify(inputs, null, 1));
    console.log('CLICKABLES:', JSON.stringify([...new Set(buttons)]));
  };

  await dump('LOGIN PAGE');

  page.on('response', async (r) => {
    const u = r.url();
    if (/login|auth|signin|token/i.test(u)) {
      let body = '';
      try { body = (await r.text()).slice(0, 300); } catch {}
      console.log(`[RESP ${r.status()}] ${u}\n   ${body}`);
    }
  });

  // Heuristic login attempt.
  try {
    const emailInput = page.locator('input[type="email"]').first();
    const passInput = page.locator('input[type="password"]').first();
    await emailInput.fill(EMAIL, { timeout: 8000 });
    await passInput.fill(PASSWORD, { timeout: 8000 });
    // Vuetify "remember me / agree" checkbox — check it in case it gates submit.
    const cb = page.locator('input[type="checkbox"]').first();
    if (await cb.count()) await cb.check({ force: true }).catch(() => {});
    await page.getByRole('button', { name: /^login$|sign in|log ?in|submit/i }).first().click({ timeout: 8000 });
    // Wait for the portal profile call, then for the SPA to leave /login.
    await page.waitForResponse(/cloudfunctions.*login/i, { timeout: 25000 }).catch(() => {});
    await page.waitForURL((u) => !u.toString().includes('/login'), { timeout: 15000 }).catch(() => {});
    if (page.url().includes('/login')) {
      await page.goto(REF + '/dashboard', { waitUntil: 'networkidle' }).catch(() => {});
    }
    await page.waitForTimeout(4000);
    await dump('AFTER LOGIN');

    // Enumerate every in-app link (router targets) + full sidebar text.
    const hrefs = await page.$$eval('a[href]', (els) =>
      [...new Set(els.map((e) => (e as HTMLAnchorElement).getAttribute('href')).filter((h): h is string => !!h && h.startsWith('/')))]
    );
    console.log('\nROUTE HREFS:', JSON.stringify(hrefs, null, 1));
    const menuText = await page.$$eval('.v-list-item__title, .v-list-item, nav *, aside *', (els) =>
      [...new Set(els.map((e) => (e.textContent || '').replace(/\s+/g, ' ').trim()).filter((t) => t && t.length < 30))]
    );
    console.log('\nMENU ITEMS:', JSON.stringify(menuText, null, 1));

    // Nav / menu text after login.
    const navText = await page.$$eval('nav, aside, [role="navigation"]', (els) =>
      els.map((e) => (e.textContent || '').replace(/\s+/g, ' ').trim()).filter(Boolean)
    );
    console.log('\nNAV TEXT:', JSON.stringify(navText, null, 1));
  } catch (e) {
    console.log('LOGIN ATTEMPT FAILED:', (e as Error).message);
  }

  await page.screenshot({ path: 'test-results/ref-explore.png', fullPage: true }).catch(() => {});
});
