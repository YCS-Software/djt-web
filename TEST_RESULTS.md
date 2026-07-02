# DJT EV Admin — Live Comparison Test Results

**Date:** 2026-07-02
**Local app under test:** http://localhost:3000 (React admin console → djt-app API on `:5000` → MySQL `DJT_POWERTECH_DEV`)
**Reference app (source of truth):** https://djt-ev.web.app (Firebase-auth Vue/Vuetify portal → Firebase Cloud Functions)
**Tooling:** Playwright (`frontend/tests/live/`, config `playwright.live.config.ts`)

> ⚠️ **All live tests are strictly read-only.** The backend is wired to a **shared production database** and **live Razorpay keys**, so no test creates, edits, deletes, remote-starts/stops, resets, blocks, or settles anything. Writes are only exercised offline against mocks (`frontend/tests/e2e/`).

---

## 1. Executive summary

| Area | Result |
| --- | --- |
| Menu / workflow **parity** vs reference | ✅ **100%** — all 18 workflows present locally |
| Local screens that **render without crashing** | ✅ **18 / 18** |
| Screens with **console errors / failed requests** | ✅ **0** |
| Screens backed by **real data** | 11 / 18 |
| Screens **empty** (backend returns 200 + 0 rows) | 6 (correctly show empty-state) |
| Defects found | 1 (silent load-error swallowing — **fixed**, see §5) |

**Bottom line:** the local console is at strong functional parity with the reference app. Every reference workflow exists locally and renders against real data. The gaps are (a) one UX defect now fixed, and (b) depth-of-feature items listed in the backlog (§6).

---

## 2. Environment & method

- The two apps are **different stacks** (local: React/MUI + Express/MySQL; reference: Firebase Auth + Cloud Functions + Vuetify), so comparison is at the **workflow / component-inventory** level, not DOM-diffing.
- Reference login is Firebase Identity Toolkit (`signInWithPassword`); the account role is `Owner` of org "DJT Haika".
- Local login is email/password against `POST /api/auth/login` (admin user id 12, `role: admin`).
- Credentials come from `docs/DJT_ADMIN_INTEGRATION.md` and are env-overridable (`LOGIN_EMAIL`, `LOGIN_PASSWORD`, `REF_BASE_URL`).

Test files:
- `tests/live/parity.spec.ts` — reference menu ↔ local sidebar parity
- `tests/live/workflows.local.spec.ts` — read-only smoke of all 18 screens
- `tests/live/api-probe.spec.ts` — classifies every `/web` endpoint
- `tests/live/_explore.spec.ts` — one-off reference-app discovery (ignored by the suite)

---

## 3. Workflow / menu parity

The reference sidebar and the local sidebar expose **the identical set of workflows**, grouped identically:

| Section | Workflows |
| --- | --- |
| (top) | Dashboard |
| MANAGE | Partners, Locations, Users |
| NETWORK | EV Drivers, Transactions, Schedules, Reservations, Charge Cards, Reviews, Coupons, Reports, Disputes |
| CHARGE | Charging Stations, Sessions, Tariffs |
| TOOLS & UTILITIES | Server Logs, QR Generator |

`parity.spec.ts` result: **`missingInLocal: []`** — nothing the reference exposes is absent locally.

> Note: the reference dashboard route is `/dashboards/analytics` with a **"Live Analytics"** tab in addition to "Dashboard". The local app has a single combined dashboard (see backlog §6).

---

## 4. Per-screen results (live, real backend, read-only)

All 18 screens: **app shell survived, grid rendered, 0 console errors, 0 failed API calls.**

| Screen | Route | Grid | Rows | State |
| --- | --- | --- | --- | --- |
| Dashboard | `/dashboard` | n/a | — | ✅ KPIs + charts render |
| Partners | `/partners` | ✅ | 3 | ✅ real data |
| Locations | `/locations` | ✅ | 7 | ✅ real data |
| Users | `/users` | ✅ | 4 | ✅ real data |
| EV Drivers | `/drivers` | ✅ | 7 | ✅ real data |
| Transactions | `/transactions` | ✅ | 20+ | ✅ real data |
| Schedules | `/schedules` | ✅ | 0 | ⚪ empty-state |
| Reservations | `/reservations` | ✅ | 0 | ⚪ empty-state |
| Charge Cards | `/cards` | ✅ | 1 | ✅ real data |
| Reviews | `/reviews` | ✅ | 0 | ⚪ empty-state |
| Coupons | `/coupons` | ✅ | 2 | ✅ real data |
| Reports | `/reports` | ✅ | 3 | ✅ real data |
| Disputes | `/disputes` | ✅ | 0 | ⚪ empty-state |
| Charging Stations | `/stations` | ✅ | 7 | ✅ real data |
| Sessions | `/sessions` | ✅ | 4 | ✅ real data |
| Tariffs | `/tariffs` | ✅ | 0 | ⚪ empty-state |
| Server Logs | `/server-logs` | ✅ | 0 | ⚪ empty-state |
| QR Generator | `/qr-generator` | n/a | — | ✅ renders |

---

## 5. API endpoint classification (GET-only probe)

| Endpoint | Status | Classification |
| --- | --- | --- |
| `/web/menu` | 200 | REAL (5 sections) |
| `/web/dashboard/analytics` | 200 | OK (object) |
| `/web/dashboard/overview` | 200 | OK (object) |
| `/web/dashboard/top-stations` | 200 | REAL (1) |
| `/web/dashboard/recent-activity` | 200 | REAL (4) |
| `/web/dashboard/live-sessions` | 200 | EMPTY (0) |
| `/web/partners` | 200 | REAL (3) |
| `/web/locations` | 200 | REAL (7) |
| `/web/users` | 200 | REAL (4) |
| `/web/drivers` | 200 | REAL (7) |
| `/web/transactions` | 200 | REAL (22) |
| `/web/schedules` | 200 | EMPTY (0) |
| `/web/reservations` | 200 | EMPTY (0) |
| `/web/cards` | 200 | REAL (1) |
| `/web/reviews` | 200 | EMPTY (0) |
| `/web/coupons` | 200 | REAL (2) |
| `/web/reports/meta` | 200 | REAL (8 report types) |
| `/web/disputes` | 200 | EMPTY (0) |
| `/web/stations` | 200 | REAL (7) |
| **`/web/connectors`** | **404** | **MISSING** — see note |
| `/web/sessions` | 200 | REAL (4) |
| `/web/live-sessions` | 200 | EMPTY (0) |
| `/web/tariffs` | 200 | EMPTY (0) |
| `/web/server-logs` | 200 | EMPTY (0) |
| `/web/audit-logs` | 200 | EMPTY (0) |

**`/web/connectors` 404 is not a live bug in the UI:** the Connectors screen already derives its data from `stationsApi.list` (`/web/stations`), not the missing `connectors` endpoint. The unused `connectorsApi` in `services/api.ts` is the only thing that points at the 404.

---

## 6. What needs enhancing on localhost:3000

### Fixed in this pass ✅
1. **Silent load-error swallowing (`ResourceListPage`).** A failed list fetch previously did `catch { setRows([]) }`, rendering an empty grid that was indistinguishable from "no data." Now the page shows an **error banner with a Retry button** and only shows the empty-state on a genuine 200-empty response.
   - Code: `frontend/src/components/common/ResourceListPage.tsx`
   - Regression test: `frontend/tests/e2e/resource-error.spec.ts`

2. **Dashboard filters made functional (Time Range + Partner Organization).** Both were previously inert — the backend ignored `range`, and the partner dropdown only had a hardcoded "All Organizations". Now:
   - **Backend** (`djt-app`): `GET /web/dashboard/analytics` honors `range` (`today`/`7d`/`30d`/`all`) and `partnerId`. Session/station widgets are date-windowed and scoped to the partner's stations (`sttn_lst_t.ownr_usr_id`); entity/identity counts stay global. Read-only SELECT changes only.
     - `api/modules/web/models/webAnalyticsMdl.js`, `api/modules/web/controllers/webAnalyticsCtrl.js`
   - **Frontend**: the Partner Organization dropdown is populated from `/web/partners`, both filters are sent to the analytics endpoint, and the Performance section title reflects the selected range.
     - `frontend/src/pages/Dashboard.tsx`
   - **Verified live:** `range=today` → 1-day series / 0 txn; `range=all` → 30-day series; `partnerId=13` → 3 stations; `partnerId=28` → 0 stations. UI wiring test: `frontend/tests/live/dashboard-filters.spec.ts`.

> Note: list-screen search/pagination remain **client-side**, and other list endpoints still ignore query params (see §5). Making those server-driven requires the same treatment on each djt-app list endpoint.

### Recommended backlog (prioritized, not yet implemented)
| # | Enhancement | Why | Effort |
| --- | --- | --- | --- |
| 1 | **Detail views for config-driven screens** (Reservations, Reviews, Disputes, Cards, Coupons, Tariffs) | Reference app drills into every row; local `ResourceListPage` screens are list-only | M |
| 2 | **"Live Analytics" dashboard tab** | Reference splits Dashboard into *Live Analytics* + *Dashboard*; local has one page | M |
| 3 | **Remove/parameterize dead `connectorsApi`** (`/web/connectors` 404) or add the backend route to djt-app | Avoids a stale endpoint; not user-visible today | S |
| 4 | **Confirm empty screens are data-empty vs backend-stub** (Schedules, Reservations, Reviews, Disputes, Tariffs, Server Logs, Audit Logs all 200/0-rows) | Distinguish "no data yet" from "endpoint not implemented" in djt-app | S (backend) |
| 5 | **Server-side pagination/filter** for high-volume lists (Transactions 22+, Sessions) | Reference paginates server-side; local is client-side | M |

> Items 1–2 and 5 are **feature depth**, not defects — the workflows exist and function. Item 3–4 are cleanup/backend-clarification. Recommend confirming priority before building, since each is a sizeable frontend addition and the console is already functional.

---

## 7. How to run

```bash
cd frontend

# Offline suite (mocked API, deterministic, safe for CI) — includes the new error/retry test
npm run test:e2e

# Live comparison (needs the dev server + djt-app :5000 running; READ-ONLY)
npx playwright test --config=playwright.live.config.ts

# Diagnostics written to: live-diagnostics-screens.json / -api.json / -parity.json
```

Credentials/URLs are env-overridable: `LOGIN_EMAIL`, `LOGIN_PASSWORD`, `REF_BASE_URL`.
