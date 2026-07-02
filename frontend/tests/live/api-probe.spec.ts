import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import { API_BASE, apiLogin } from './helpers';

/**
 * Classify every /web admin endpoint the frontend calls: real (data), empty
 * (200 but no rows), stub, or missing (4xx/5xx). This drives the gap analysis
 * in the results doc. Strictly GET-only.
 */

const ENDPOINTS: { name: string; path: string; rowsKey?: string }[] = [
  { name: 'menu', path: '/web/menu' },
  { name: 'dashboard/analytics', path: '/web/dashboard/analytics' },
  { name: 'dashboard/overview', path: '/web/dashboard/overview' },
  { name: 'dashboard/top-stations', path: '/web/dashboard/top-stations' },
  { name: 'dashboard/recent-activity', path: '/web/dashboard/recent-activity' },
  { name: 'dashboard/live-sessions', path: '/web/dashboard/live-sessions' },
  { name: 'partners', path: '/web/partners' },
  { name: 'locations', path: '/web/locations' },
  { name: 'users', path: '/web/users' },
  { name: 'drivers', path: '/web/drivers' },
  { name: 'transactions', path: '/web/transactions' },
  { name: 'schedules', path: '/web/schedules' },
  { name: 'reservations', path: '/web/reservations' },
  { name: 'cards', path: '/web/cards' },
  { name: 'reviews', path: '/web/reviews' },
  { name: 'coupons', path: '/web/coupons' },
  { name: 'reports/meta', path: '/web/reports/meta' },
  { name: 'disputes', path: '/web/disputes' },
  { name: 'stations', path: '/web/stations' },
  { name: 'connectors', path: '/web/connectors' },
  { name: 'sessions', path: '/web/sessions' },
  { name: 'live-sessions', path: '/web/live-sessions' },
  { name: 'tariffs', path: '/web/tariffs' },
  { name: 'server-logs', path: '/web/server-logs' },
  { name: 'audit-logs', path: '/web/audit-logs' },
];

function countRows(body: any): number | null {
  if (!body || typeof body !== 'object') return null;
  if (Array.isArray(body)) return body.length;
  if (Array.isArray(body.rows)) return body.rows.length;
  if (Array.isArray(body.data)) return body.data.length;
  const firstArray = Object.values(body).find((v) => Array.isArray(v));
  return Array.isArray(firstArray) ? firstArray.length : null;
}

test('probe all /web endpoints', async ({ request }) => {
  const token = await apiLogin(request);
  const out: any[] = [];

  for (const e of ENDPOINTS) {
    const r = await request.get(`${API_BASE}${e.path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    let body: any = null;
    try {
      body = await r.json();
    } catch {
      body = null;
    }
    const rows = countRows(body);
    let classification: string;
    if (r.status() >= 500) classification = 'ERROR (5xx)';
    else if (r.status() === 404) classification = 'MISSING (404)';
    else if (r.status() >= 400) classification = `CLIENT (${r.status()})`;
    else if (rows === null) classification = 'OK (object)';
    else if (rows === 0) classification = 'EMPTY (0 rows)';
    else classification = `REAL (${rows} rows)`;

    out.push({ name: e.name, path: e.path, status: r.status(), rows, classification });
    console.log(`${classification.padEnd(16)} ${e.path}`);
  }

  fs.writeFileSync('live-diagnostics-api.json', JSON.stringify(out, null, 2));
  // The suite passes as long as auth worked; classification is the deliverable.
  expect(out.length).toBe(ENDPOINTS.length);
});
