import { Page, expect } from '@playwright/test';

/**
 * Shared test utilities: valid admin credentials, an in-browser API mock layer,
 * and an auth-seeding helper so specs can start already logged in.
 *
 * All resource calls hit `/web/<resource>` and list endpoints return
 * `{ rows: [...] }` (see CLAUDE.md). Auth lives under `/auth/...`.
 */

export const VALID_EMAIL = 'admin@djt.com';
export const VALID_PASSWORD = 'password123';

const ADMIN_USER = {
  id: 'u-admin',
  email: VALID_EMAIL,
  name: 'Admin User',
  role: 'admin',
};

// Seed users returned by GET /web/users.
export const SEED_USERS = [
  { id: 'u-1', name: 'Ada Lovelace', email: 'ada@djt.com', phone: '555-0001', role: 'admin', status: 'active', createdAt: '2026-01-02' },
  { id: 'u-2', name: 'Alan Turing', email: 'alan@djt.com', phone: '555-0002', role: 'operator', status: 'active', createdAt: '2026-01-03' },
];

// Menu returned by GET /web/menu (role-based sidebar). Kept minimal but real.
const MENU = [
  { heading: '', items: [{ title: 'Dashboard', path: '/dashboard' }] },
  {
    heading: 'MANAGE',
    items: [
      { title: 'Partners', path: '/partners' },
      { title: 'Locations', path: '/locations' },
      { title: 'Users', path: '/users' },
    ],
  },
];

type Json = Record<string, unknown> | unknown[];

// CORS headers so the mocks work whether the app calls the API same-origin
// (Playwright-started server) or cross-origin (a reused dev server pointing at
// :5000). Without these, a cross-origin XHR to a fulfilled route is blocked.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

const json = (body: Json, status = 200) => ({
  status,
  contentType: 'application/json',
  headers: CORS,
  body: JSON.stringify(body),
});

/**
 * Intercept every `/api/**` request and answer with deterministic fixtures.
 * The users list is stateful: creating/deleting a user is reflected on the
 * next GET, so the slice's re-fetch-after-write flow can be exercised.
 */
export async function installApiMocks(page: Page): Promise<void> {
  const users = SEED_USERS.map((u) => ({ ...u }));

  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const method = req.method();
    // Answer CORS preflight so cross-origin POSTs (login) aren't blocked.
    if (method === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS, body: '' });
    }
    // Strip origin + leading /api so we match on the resource path only.
    const path = new URL(req.url()).pathname.replace(/^\/api/, '');

    // ── Auth ────────────────────────────────────────────────────────────────
    if (method === 'POST' && path === '/auth/login') {
      const { email, password } = (req.postDataJSON() ?? {}) as {
        email?: string;
        password?: string;
      };
      if (email === VALID_EMAIL && password === VALID_PASSWORD) {
        return route.fulfill(
          json({ user: ADMIN_USER, accessToken: 'test-access', refreshToken: 'test-refresh' })
        );
      }
      return route.fulfill(json({ error: 'Invalid email or password' }, 401));
    }
    if (method === 'POST' && path === '/auth/logout') {
      return route.fulfill(json({ success: true }));
    }
    if (path === '/auth/me') {
      return route.fulfill(json({ user: ADMIN_USER }));
    }

    // ── Navigation menu ───────────────────────────────────────────────────────
    if (path === '/web/menu') {
      return route.fulfill(json({ menu: MENU, role: 'admin' }));
    }

    // ── Users (stateful) ──────────────────────────────────────────────────────
    if (path === '/web/users') {
      if (method === 'GET') return route.fulfill(json({ rows: users }));
      if (method === 'POST') {
        const data = (req.postDataJSON() ?? {}) as Record<string, unknown>;
        users.push({ id: `u-${users.length + 1}`, status: 'active', createdAt: '2026-07-02', ...(data as any) });
        return route.fulfill(json({ success: true }, 201));
      }
    }
    if (path.startsWith('/web/users/')) {
      const id = path.split('/').pop();
      if (method === 'PUT') {
        const idx = users.findIndex((u) => u.id === id);
        if (idx >= 0) users[idx] = { ...users[idx], ...(req.postDataJSON() as any) };
        return route.fulfill(json({ success: true }));
      }
      if (method === 'DELETE') {
        const idx = users.findIndex((u) => u.id === id);
        if (idx >= 0) users.splice(idx, 1);
        return route.fulfill(json({ success: true }));
      }
      if (method === 'GET') return route.fulfill(json(users.find((u) => u.id === id) ?? {}));
    }

    // ── Dashboard (null payloads render safely; the UI guards every access) ────
    if (path === '/web/dashboard/analytics') return route.fulfill(json({ analytics: null }));
    if (path === '/web/dashboard/overview') return route.fulfill(json({ overview: null }));
    if (path === '/web/dashboard/top-stations') return route.fulfill(json({ stations: [] }));
    if (path === '/web/dashboard/recent-activity') return route.fulfill(json({ activity: [] }));
    if (path === '/web/dashboard/live-sessions') return route.fulfill(json({ sessions: [] }));

    // ── Generic fallback ──────────────────────────────────────────────────────
    if (method === 'GET') return route.fulfill(json({ rows: [] }));
    return route.fulfill(json({ success: true }));
  });
}

/**
 * Seed a logged-in session before the app boots. authSlice derives
 * `isAuthenticated` from the presence of `accessToken` in localStorage, so
 * setting it via an init script lets protected routes render immediately.
 */
export async function seedAuth(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem('accessToken', 'test-access');
    window.localStorage.setItem('refreshToken', 'test-refresh');
  });
}

/** Log in through the UI and wait for the dashboard. */
export async function loginViaUi(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(VALID_EMAIL);
  await page.getByLabel('Password').fill(VALID_PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
