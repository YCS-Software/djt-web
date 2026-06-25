# DJT EV Admin Console — Feature Spec & Implementation Plan

> Reference platform: **https://djt-ev.web.app** (login `yerrasekhar3@gmail.com / Pass@7890`).
> This document captures the features replicated/implemented in this repo (`djt-web`) and the
> concrete work delivered for the three requests:
> 1. Make the **Dashboard** more efficient and better looking.
> 2. Add **Add / Edit / Delete (CRUD)** to **Partners, Locations, Users** under *Manage*.
> 3. Implement the full **Reports** functionality from the reference platform.
>
> Generated: 2026-06-24

---

## 1. Reference platform map (djt-ev.web.app)

The reference is a green-themed EV charging network admin console ("DJT / Haika"). Its information
architecture (already mirrored by this repo's sidebar) is:

| Group | Screens |
|---|---|
| **Live Analytics** | Dashboard (KPI cards + uptime/charge-time/idle-time/consumption/session/downtime/station-status charts) |
| **Manage** | Partners (Partner Organizations), Locations, Users |
| **Network** | EV Drivers, Transactions, Schedules, Reservations, Charge Cards, Reviews, Coupons, **Reports**, Disputes |
| **Charge** | Charging Stations |

The Dashboard shows: filterable Time Range + Partner Organization selectors, 9 KPI cards
(Partner Organizations, Locations, Users, Charging Stations, EV Drivers, Remaining Wallet Balance,
Charging Transaction Amount, kWh Consumption, Wallet Topup Count) and the analytics chart grid.

---

## 2. Dashboard — efficiency & visual upgrade

**Goal:** keep the exact data contract (`dashboard/analytics` → `AnalyticsData`) but make the page
faster and cleaner.

Delivered:
- **Memoized chart option builders** (`useMemo`) so Apex options are not recreated on every render
  (filter changes, hovers). Reduces re-render cost of the heavy chart grid.
- **Gradient KPI cards** with a colored icon tile, large value, and a subtle accent strip —
  denser, more scannable 3×3 grid.
- **Section headers** ("Overview", "Performance", "Reliability") instead of a single divider, so the
  long page reads in clear bands.
- Consistent card shell (border, soft shadow, radius), unified empty-state, sticky filter row.
- Time-range filter is wired to re-fetch analytics (`fetchAnalytics({ range })`).

Files: `frontend/src/pages/Dashboard.tsx`.

---

## 3. Manage CRUD — Partners, Locations, Users

**Goal:** an admin can **Add**, **Edit**, and **Delete** records on all three Manage screens.

Delivered for each screen:
- A primary **"+ Add"** button in the page header.
- An **Actions** column with **Edit** (pencil) and **Delete** (trash) icon buttons per row.
- A shared, field-driven **`FormDialog`** for create/edit (validates required fields).
- A **`ConfirmDialog`** for delete.
- Success/error **Snackbar** feedback, and automatic list refresh after every mutation.

### Reusable component
`frontend/src/components/common/FormDialog.tsx` — a schema-driven dialog. Pass a `fields` array
(`{ name, label, type, options, required, ... }`) and `initialValues`; it renders a responsive
2‑column form, tracks state, enforces required fields, and returns the values on submit.

### Entity field sets

| Entity | Fields |
|---|---|
| **Partners** | name*, email*, phone, companyName, gstNumber, panNumber, address, city, state, pincode, commissionRate, status |
| **Locations** | name*, address, city, state, pincode, latitude, longitude, contactPhone, contactEmail, status |
| **Users** | name*, email*, phone, password (create only), role, status |

### Redux thunks added
Each slice gains `create*`, `update*`, `delete*` thunks that call the existing REST API
(`POST /<entity>`, `PUT /<entity>/:id`, `DELETE /<entity>/:id`) and re-fetch the list on success.

Files:
- `frontend/src/features/{partners,locations,users}/*Slice.ts`
- `frontend/src/pages/{partners/Partners,locations/Locations,users/Users}.tsx`
- `frontend/src/components/common/FormDialog.tsx`

> **Backend contract used:** the create/update/delete endpoints already declared in
> `services/api.ts` (`partnersApi`, `locationsApi`, `usersApi`) and implemented in
> `backend/src/controllers/{partner,location,user}Controller.js`.

---

## 4. Reports — full implementation

The reference platform's Reports area exposes multiple report **types**, each with a **date range**
(and partner/station scope) plus on-screen summary + tabular results and **export**. This repo's
backend already implements all six report endpoints (`backend/src/controllers/reportController.js`):

| Report | Endpoint | Summary metrics | Table columns |
|---|---|---|---|
| **Sessions** | `GET /reports/sessions` | total sessions, energy, revenue, avg duration | station, location, driver, start, end, duration, energy, cost, status |
| **Revenue** | `GET /reports/revenue` | total revenue, txns, avg txn | period, amount, transaction count |
| **Energy** | `GET /reports/energy` | total energy, sessions, avg/session | period, energy, session count |
| **Utilization** | `GET /reports/utilization` | — | station, location, sessions, duration, energy, revenue |
| **Driver Activity** | `GET /reports/driver-activity` | — | driver, email/phone, sessions, energy, spent |
| **Settlement** | `GET /reports/settlement` | — | partner, revenue, commission %, commission, settlement, txns |

Delivered:
- A tabbed **Reports** page: one tab per report type.
- **Date range** pickers (start / end), defaulting to the last 30 days, plus a **Run** button.
- **Summary KPI strip** for reports that return summaries.
- **Trend chart** (bar/area) for revenue & energy reports.
- **Results table** (DataTable) per report type.
- **Export** to **CSV** (client-side) and a hook to the server's CSV/PDF export where available.

Files:
- `frontend/src/pages/reports/Reports.tsx` (rewritten)
- `frontend/src/features/reports/reportsSlice.ts` (multi-report thunks)
- `frontend/src/services/api.ts` (`reportsApi.driverActivity` aligned to `/reports/driver-activity`)

> The page degrades gracefully: if an endpoint returns no rows (e.g. empty dev DB), each tab shows a
> clean "No data for the selected range" state rather than erroring.

---

## 5. Out of scope / notes

- Live-site scraping was **not** possible via tooling (the reference is an authenticated SPA), so the
  Reports feature set is reconstructed from the existing backend report controller (the authoritative
  contract) plus the reference IA. All six report types it supports are implemented.
- No live DB writes are performed by this document; CRUD operations act through the app's own API.
- Auth/admin login design is documented separately in `docs/DJT_ADMIN_INTEGRATION.md`.

---

## 6. Complete menu map (extracted from djt-ev.web.app bundle)

The reference platform is a **Vuetify / Nuxt 3** admin (Materio template). Its exact sidebar —
section headings, item names, and icons — was extracted from the production JS bundle
(`/assets/index.*.js`). The console replicates this **1:1** (same section names, same item names,
brand = **DJT Haika** logo). Tabler icons are mapped to the closest MUI outlined icons.

| Section | Items (exact names) |
|---|---|
| **LIVE ANALYTICS** | Dashboard · Live Sessions |
| **MANAGE** | Business · Partners · Settlements · Locations · Users |
| **NETWORK** | EV Drivers · Transactions · Schedules · Reservations · Charge Cards · Reviews · Coupons · Reports · Disputes · Subscriptions · Member Groups · Courtesy Sessions · Agents |
| **ROAMING** | CDR · EMSP Tokens |
| **CHARGE** | Charging Stations · Downtime · Maps · Sessions · Smart Scheduling |
| **TOOLS & UTILITIES** | Static Data · Configurations · Connections · Bulk Remote · Instructions · Server Logs · QR Generator · Access Control |
| **ADMIN TOOLS** | Business Configuration · Platform Configuration · App Control · Paywall Control · Products Link |

### 6.1 Per-screen operations implemented

Every menu item now has a real screen. The standard screen = **PageHeader + filterable DataTable**,
and entity screens additionally get **Add / Edit / Delete** via the shared `FormDialog` +
`ConfirmDialog` + success/error Snackbar (the same CRUD pattern delivered for Partners/Locations/Users).

| Screen | Type | Operations |
|---|---|---|
| Dashboard | Custom analytics | KPI cards + chart grid + filters |
| Live Sessions | Live table | Auto-refresh, stop session, status chips |
| Business | Entity CRUD | List/Add/Edit/Delete business organisations |
| Partners | Entity CRUD | List/Add/Edit/Delete |
| Settlements | Table + action | List, view, mark settled |
| Locations | Entity CRUD | List/Add/Edit/Delete |
| Users | Entity CRUD | List/Add/Edit/Delete |
| EV Drivers | Table | List, view, wallet |
| Transactions | Table | List, filter, export |
| Schedules | Table | List |
| Reservations | Table | List, cancel |
| Charge Cards | Entity CRUD | List/Add/Edit, block/unblock |
| Reviews | Table | List, reply, delete |
| Coupons | Entity CRUD | List/Add/Edit/Delete |
| Reports | Custom tabs | 6 report types, date filters, charts, CSV export |
| Disputes | Table | List, resolve |
| Subscriptions | Entity CRUD | List/Add/Edit/Delete plans |
| Member Groups | Entity CRUD | List/Add/Edit/Delete |
| Courtesy Sessions | Entity CRUD | List/Add, grant courtesy session |
| Agents | Entity CRUD | List/Add/Edit/Delete |
| CDR | Table | Charge Detail Records, export |
| EMSP Tokens | Entity CRUD | List/Add/Edit/Delete roaming tokens |
| Charging Stations | Entity CRUD | List/Add/Edit/Delete, remote actions |
| Downtime | Table | List downtime windows |
| Maps | Custom map | Leaflet map of locations/stations |
| Sessions | Table | List, view |
| Smart Scheduling | Entity CRUD | List/Add/Edit/Delete load schedules |
| Static Data | Table | Reference data lists |
| Configurations | Settings | Key/value configuration list |
| Connections | Table | OCPP/peer connections status |
| Bulk Remote | Action | Bulk remote command form |
| Instructions | Content | Operator instructions / docs |
| Server Logs | Table | OCPP/CSMS server logs |
| QR Generator | Tool | Generate & download station/connector QR |
| Access Control | Roles CRUD | Roles & permissions matrix |
| Business Configuration | Settings | Business-level config form |
| Platform Configuration | Settings | Platform-level config form |
| App Control | Settings | Mobile app config / feature flags |
| Paywall Control | Settings | Paywall / subscription gating |
| Products Link | Table/CRUD | Linked product catalogue |

### 6.2 Implementation approach
- **`components/common/ResourceListPage.tsx`** — a config-driven page (title, columns, fetcher,
  optional CRUD + form fields). Most menu screens are a thin config over this, keeping the
  codebase small and uniform.
- **`components/common/SettingsForm.tsx`** — config-driven key/value settings used by the
  Admin-Tools screens.
- **Maps** uses the already-bundled `react-leaflet`/`leaflet`.
- New API groups added in `services/api.ts` under the `/web/*` namespace, matching the existing
  contract. Screens degrade gracefully to an empty state when an endpoint isn't available yet.
- Sidebar, routes (`App.tsx`) and the Redux store are extended to wire every screen.
