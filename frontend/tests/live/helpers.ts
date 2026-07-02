import { Page, APIRequestContext, expect } from '@playwright/test';

/**
 * Live-comparison helpers. Everything here is READ-ONLY against a shared
 * production database + LIVE-payment backend — never create/mutate/delete.
 */

export const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const REF_BASE = process.env.REF_BASE_URL || 'https://djt-ev.web.app';

// Credentials are NEVER hardcoded — supply them via env before running the
// live suite, e.g. (PowerShell):  $env:LOGIN_EMAIL='...'; $env:LOGIN_PASSWORD='...'
export const EMAIL = process.env.LOGIN_EMAIL || '';
export const PASSWORD = process.env.LOGIN_PASSWORD || '';

export function requireCreds(): void {
  if (!EMAIL || !PASSWORD) {
    throw new Error(
      'Live tests need LOGIN_EMAIL and LOGIN_PASSWORD env vars (no credentials are stored in the repo).'
    );
  }
}

/** The workflow screens the local admin console exposes (mirrors djt-ev.web.app). */
export const SCREENS: { name: string; path: string; kind: 'grid' | 'dashboard' | 'other' }[] = [
  { name: 'Dashboard', path: '/dashboard', kind: 'dashboard' },
  { name: 'Partners', path: '/partners', kind: 'grid' },
  { name: 'Locations', path: '/locations', kind: 'grid' },
  { name: 'Users', path: '/users', kind: 'grid' },
  { name: 'EV Drivers', path: '/drivers', kind: 'grid' },
  { name: 'Transactions', path: '/transactions', kind: 'grid' },
  { name: 'Schedules', path: '/schedules', kind: 'grid' },
  { name: 'Reservations', path: '/reservations', kind: 'grid' },
  { name: 'Charge Cards', path: '/cards', kind: 'grid' },
  { name: 'Reviews', path: '/reviews', kind: 'grid' },
  { name: 'Coupons', path: '/coupons', kind: 'grid' },
  { name: 'Reports', path: '/reports', kind: 'other' },
  { name: 'Disputes', path: '/disputes', kind: 'grid' },
  { name: 'Charging Stations', path: '/stations', kind: 'grid' },
  { name: 'Sessions', path: '/sessions', kind: 'grid' },
  { name: 'Tariffs', path: '/tariffs', kind: 'grid' },
  { name: 'Server Logs', path: '/server-logs', kind: 'other' },
  { name: 'QR Generator', path: '/qr-generator', kind: 'other' },
];

/** The reference-app menu captured from djt-ev.web.app (source of truth). */
export const REF_MENU = [
  'Dashboard', 'Partners', 'Locations', 'Users', 'EV Drivers', 'Transactions',
  'Schedules', 'Reservations', 'Charge Cards', 'Reviews', 'Coupons', 'Reports',
  'Disputes', 'Charging Stations', 'Sessions', 'Tariffs', 'Server Logs', 'QR Generator',
];

/** Log into the local backend once and return a real admin JWT. */
export async function apiLogin(request: APIRequestContext): Promise<string> {
  requireCreds();
  const r = await request.post(`${API_BASE}/auth/login`, { data: { email: EMAIL, password: PASSWORD } });
  expect(r.ok(), `local login failed: ${r.status()}`).toBeTruthy();
  return (await r.json()).accessToken as string;
}

/** Seed a real admin token into localStorage so the app boots authenticated. */
export async function seedLocalAuth(page: Page, token: string): Promise<void> {
  await page.addInitScript((t) => {
    window.localStorage.setItem('accessToken', t);
    window.localStorage.setItem('refreshToken', t);
  }, token);
}

/** Log into the deployed reference app (Firebase auth). Best-effort. */
export async function loginRef(page: Page): Promise<boolean> {
  requireCreds();
  await page.goto(`${REF_BASE}/login`, { waitUntil: 'networkidle' });
  await page.locator('input[type="email"]').first().fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  const cb = page.locator('input[type="checkbox"]').first();
  if (await cb.count()) await cb.check({ force: true }).catch(() => {});
  await page.getByRole('button', { name: /^login$|sign in/i }).first().click();
  await page.waitForURL((u) => !u.toString().includes('/login'), { timeout: 20000 }).catch(() => {});
  if (page.url().includes('/login')) {
    await page.goto(`${REF_BASE}/dashboards/analytics`, { waitUntil: 'networkidle' }).catch(() => {});
  }
  await page.waitForTimeout(3000);
  return !page.url().includes('/login');
}
