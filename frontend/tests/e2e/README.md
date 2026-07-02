# E2E tests (Playwright)

End-to-end tests for the DJT EV admin console. They run **fully offline** — every
`/api/**` request is intercepted and answered with fixtures in
[`helpers.ts`](./helpers.ts), so **no djt-app backend is required**.

## Running

```bash
cd frontend
npm run test:e2e          # headless run (auto-starts the CRA dev server on :3000)
npm run test:e2e:ui       # interactive UI mode
npm run test:e2e:report   # open the last HTML report
```

Playwright's `webServer` boots `npm start` automatically (reusing a running dev
server if one is already up) with `REACT_APP_API_URL=http://localhost:3000/api`
so the mocked API is same-origin.

## How the mocking works

- `installApiMocks(page)` — routes all `/api/**` calls. Auth (`/auth/login`) checks
  the credentials in `VALID_EMAIL` / `VALID_PASSWORD`; `/web/users` is **stateful**
  so create/delete is reflected on the next list fetch; the dashboard endpoints
  return null payloads (the UI guards every access with `?.`).
- `seedAuth(page)` — writes `accessToken` to `localStorage` before the app boots,
  so specs can start already logged in (authSlice derives `isAuthenticated` from it).
- `loginViaUi(page)` — drives the real login form and waits for `/dashboard`.

## Coverage

| Spec | What it checks |
| --- | --- |
| `login.spec.ts` | protected-route redirect, client validation, invalid-credential error, successful login |
| `navigation.spec.ts` | root → dashboard redirect, sidebar navigation, logout |
| `users.spec.ts` | list rendering, create-via-dialog + list refresh, required-field validation |

When adding a screen, follow the same pattern: add fixtures/routes in `helpers.ts`
and a spec that seeds auth, navigates, and asserts on stable text or roles.
