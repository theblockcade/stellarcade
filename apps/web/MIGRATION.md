# Migration status: frontend/ (Vite) → apps/web (Next.js)

Started 2026-08-10, per an explicit decision to migrate despite the framework
tradeoffs (SSR/SEO matters little for a wallet-connected dashboard — see the
"why" note below). This file tracks exactly what's been ported and what's
pending — update it every time a page or component moves.

## Status: all four core routes are live

| Route | Component | Status |
|---|---|---|
| `/` | Landing (new) | ✅ Statically prerendered |
| `/app` | `GameLobby` | ✅ Verified in `next dev` |
| `/portfolio` | `Portfolio` | ✅ Verified in `next dev` |
| `/profile` | `ProfileSettings` | ✅ Verified in `next dev` |

**633 tests passing, `tsc --noEmit` clean, `next build` clean, all 5 routes
statically prerendered.** This is not "the scaffold exists" — every route
was checked in a running dev server, including confirming the "resource not
found" states on pages that call a backend API (no backend runs in this dev
environment, so that error state is *correct* behavior, not a bug).

## Why this migration, and why it took this long

`frontend/` is not a stub: 176 test files, 2429 passing tests, ~180
components, 5-locale i18n, real Freighter wallet integration. Every
dashboard page pulled in a deep chain of shared components and services —
porting one page faithfully meant transitively porting a large slice of
that chain too. `GameLobby` alone pulled in 20+ direct component
dependencies and several nested services (`WalletSessionService`,
`network-guard-middleware`, `typed-api-sdk`) totaling well over 5,000 lines
once everything it touches is counted.

## What's ported

Every shared-chrome piece (`AppSidebar`, `CommandPalette`,
`NotificationCenter`, `LocaleSwitcher`, `BreadCrumbs`,
`FeatureFlagsProvider`, `ModalStackProvider`), the full state layer
(`GlobalStateStore`, `errorStore`, `WalletSessionService`,
`network-guard-middleware`, `typed-api-sdk`'s `ApiClient`), every type
catalog those depend on (`errors.ts`, `global-state.ts`, `wallet-session.ts`,
`notification.ts`, `pagination.ts`, `tx-status.ts`, `status-tone.ts`,
`api-client.ts`, `api-trace.ts`, `network-guard-middleware.ts`,
`contracts/prizePool.ts`), and ~45 `components/v1/*` components — everything
`GameLobby`, `Portfolio`, and `ProfileSettings` needed. Self-hosted fonts
(`next/font`, zero requests to fonts.googleapis.com — `frontend/` still uses
the CDN `<link>` approach) and `@stellarcade/tokens` wiring are done too.

**Full file list**: `git log --stat` on this repo's `feat(web):` commits, or
just look in `apps/web/src/`.

## Real bugs found and fixed during the port (not present in frontend/)

1. **Next's bundler (Turbopack) doesn't resolve an explicit `.js` extension**
   pointing at a `.ts`/`.tsx` source file, the way Vite/Vitest and Node ESM
   do. Every relative import across `apps/web` had to drop the extension.
2. **React 19 handles the `inert` boolean attribute differently than React
   18** — `AppSidebar` and `Drawer` needed a real `inert={boolean}` prop
   instead of the `inert: ""` string hack React 18 needed.
3. **`jsdom` (this project's test environment) doesn't implement
   `scrollIntoView` at all** — `frontend/` uses `happy-dom`, which
   polyfills it. Stubbed in `vitest.setup.ts`.
4. **`waitFor` deadlocks against `vi.useFakeTimers()`** in
   `QueueHealthWidget.test.tsx`'s auto-refresh test — `waitFor`'s own
   polling uses real timers, so nothing ever un-froze fake time between
   polls. Fixed by asserting directly inside `act()` after
   `advanceTimersByTime` instead of wrapping in `waitFor`.
5. **`GameLobby.test.tsx`'s `vi.mock()` calls used stale `frontend/`-relative
   paths** (`"../../src/hooks/v1/useWalletStatus"`) that didn't match the
   new file layout, so two of three mocks silently failed to intercept the
   real modules — 11 of 12 tests passed anyway (the real hooks happened to
   return states close enough to the mocks' defaults), masking the bug until
   the one test that actually depended on mock-driven state transitions
   failed. Fixed by updating the mock paths to match.
6. **`DataTable.tsx`'s bare `JSX.Element` return type doesn't resolve**
   under this project's TS/React 19 setup — changed to `React.JSX.Element`.

Finding #5 is the one worth remembering: a wrong `vi.mock()` path doesn't
error, it just silently no-ops, and most assertions can still pass by
coincidence. Don't trust "11/12 passed" as "basically fine" — the one
failure was pointing at a real, structural problem.

## Not yet ported

`~135` remaining `components/v1/*` components that no route currently
reaches (they belong to pages/flows not yet built in `apps/web` — cleanup
wizard, contract detail views, audit log, analytics dashboard, and similar
frontend/ pages that were never wired into the original `App.tsx` routing
either, so they're not blocking anything). Audit these component-by-component
before the next slice, rather than porting speculatively.

## Cutover

`frontend/` stays the live app until a deliberate decision is made to
switch — having all four routes working in `apps/web` is a strong signal
that cutover is *close*, but "the four main pages render" is not the same
bar as "this can take production traffic." Before cutover:

- Wire real navigation between routes (`AppSidebar` takes `onNavigate` as a
  prop today — nothing calls `next/navigation`'s router from it yet).
- Decide whether `/app` is the right path for the lobby, or whether it
  should be `/` (bumping the new landing page elsewhere) — a product
  decision, not a technical one.
- Run this against a real backend, not just confirm the error states look
  right.
- Full a11y and Lighthouse pass on all 5 routes.
