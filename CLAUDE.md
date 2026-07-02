# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

`djt-web` is the **admin web console only** — a React (CRA) + TypeScript single-page app under `frontend/`. It is the DJT EV charging management admin panel (mirrors the screens of `djt-ev.web.app`).

There is **no backend in this repo anymore.** It was removed (commit "remove bundled backend; point admin panel at shared DJT-App API"). The `backend/` folder now only holds leftover `node_modules`, a `.env`, and a stale `dev.sqlite` — ignore it. The real API is the shared **djt-app** server (separate repo at `D:\personal\djt-app`, Node/Express "phone-auth-server" on port 5000, routes under `/api`). Admin endpoints live under the `/web` namespace (`/api/web/...`), behind `verifyToken + isAdmin`.

## Commands

All commands run from `frontend/`:

```bash
cd frontend
npm install
npm start        # dev server with hot reload (CRA, port 3000)
npm run build    # production build
npm test         # react-scripts test (Jest + RTL); no test files exist yet
```

There is no separate lint step — ESLint runs via `react-scripts` (`eslintConfig: extends react-app`) during `start`/`build`.

The frontend talks to the API via `REACT_APP_API_URL` (set in `frontend/.env`, default `http://localhost:5000/api`). Point this at a running djt-app instance.

### Docker

`docker-compose.yml` builds **only** the admin frontend + an nginx reverse proxy that forwards `/api` to the shared djt-app server. Set `API_UPSTREAM` (host:port) to point at it (default `3.110.84.196:5000`). It does NOT run a database, Redis, or backend — the README's "Quick Start" describing those is outdated.

## Architecture

The app is a CRUD admin console over ~50 entity screens. The structure is deliberately uniform — learn one screen and you know them all.

**Three layers, one entity per slice:**
- `src/services/api.ts` — single axios instance + one exported `*Api` object per resource. All resource calls hit `/web/<resource>`. The `crud(base)` helper generates `list/getById/create/update/delete` for the many simpler entities. Auth (`/auth/...`) is the exception, not under `/web`.
- `src/features/<entity>/<entity>Slice.ts` — Redux Toolkit slice per entity (createAsyncThunk for fetch/create/update/delete; create/update/delete re-dispatch `fetch` on success). Registered in `src/store/index.ts`.
- `src/pages/<entity>/<Entity>.tsx` — the screen, lazy-loaded and routed in `src/App.tsx`.

**Two screen styles coexist** (when adding a screen, match the neighbor you're editing):
1. Full Redux slice + hand-written page (e.g. `users`, `partners`, `stations`) — the older, richer screens with detail pages (`<Entity>Detail.tsx`).
2. Config-driven `ResourceListPage` (`src/components/common/ResourceListPage.tsx`) — pass `columns`, a `fetcher`, optional `formFields` + `createFn/updateFn/deleteFn`, and it renders the table, add/edit `FormDialog`, delete `ConfirmDialog`, toasts, and optional `autoRefreshMs`. Most newer DJT-EV menu screens use this and call the `*Api` objects directly, no slice.

**Shared building blocks** in `src/components/common/`: `DataTable` (MUI X DataGrid wrapper), `FormDialog` (`FieldDef`-driven forms), `ConfirmDialog`, `PageHeader`, `StatsCard`, `StatusChip`. Reuse these instead of rebuilding.

**Auth flow:** JWT in `localStorage` (`accessToken` / `refreshToken`). `api.ts` request interceptor attaches the bearer token; the response interceptor auto-refreshes on 401 via `/auth/refresh` and redirects to `/login` if refresh fails. `ProtectedRoute` in `App.tsx` gates everything behind `state.auth.isAuthenticated`.

**Navigation is role-based and server-driven.** The sidebar sections come from `GET /web/menu` (`features/menu/menuSlice.ts`), so the visible menu depends on the logged-in admin's role — routes still exist in `App.tsx` regardless.

**Layout:** `index.tsx` wires `Provider` → `BrowserRouter` → MUI `ThemeProvider` → `LocalizationProvider` (date-fns). `MainLayout` (sidebar + content) wraps protected routes; `AuthLayout` wraps `/login`.

## Conventions

- **Theme:** DJT Haika brand green `#14532d` (primary) with a gold/lime secondary `#b7791f`, on a warm `#f6f4ec` background — defined in `src/theme/index.ts` and applied app-wide. Don't hardcode off-brand colors.
- **Live DB schema quirk:** the real MySQL DB (`DJT_POWERTECH_DEV`) uses abbreviated table names (`usr_lst_t`, `sssn_lst_t`, `wllt_lst_t`, `trxn_lst_t`) — NOT the `users_t` names in djt-app's `schema.sql`. See `docs/DJT_ADMIN_INTEGRATION.md` for the verified schema, the admin email+password login design, and the frontend↔backend API gap. Read it before touching anything that assumes backend behavior.
- Response shapes vary; list endpoints generally return `{ rows: [...] }`. Slices read `r.data.rows`; `ResourceListPage` auto-detects rows (`rows`/`data`/first array property).

## Docs

`docs/` holds the product/engineering specs: `DJT_ADMIN_INTEGRATION.md` (backend integration — most important for cross-repo work), `API.md`, `openapi.yaml`, `DATABASE_DESIGN.md`, `ROLES_PERMISSIONS.md`, `DESIGN_SYSTEM.md`, `FRD.md`/`SRS.md`/`TDD.md`/`WORKFLOWS.md`.
