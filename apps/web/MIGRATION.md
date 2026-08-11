# Migration record: frontend/ (Vite) → apps/web (Next.js)

**Status: complete.** Started 2026-08-10, per an explicit decision to
migrate despite the framework tradeoffs (SSR/SEO matters little for a
wallet-connected dashboard — see the "why" note below). `frontend/` was
removed from the repo on 2026-08-11 (commit `f1da571`) once every route and
component it had that was still reachable was ported. This file is kept as
the historical record of what moved and what broke along the way, not an
active tracking document — nothing here needs updating going forward.

## Final state

| Route | Component | Notes |
|---|---|---|
| `/` | Landing (new) | Statically prerendered |
| `/app` | `GameLobby` | Game lobby |
| `/portfolio` | `Portfolio` | Wallet/rewards/collectibles |
| `/profile` | `ProfileSettings` | Account settings |
| `/verify` | Fairness verifier | New — recomputes seed commitments and outcomes client-side against `@stellarcade/sdk`'s fairness logic; no Vellar equivalent, built to close the "provably fair" claim with a working proof, not just prose |
| `/cleanup` | Account hygiene | New — Stellar reserve/trustline cleanup, StellarCade-specific (stale game trustlines, expired reward tokens), not a wallet-policy reskin |
| `/about` | Project info | New — real project content, no fabricated team bios |

**723 tests passing, `tsc --noEmit` clean, `next build` clean, all 8 routes
statically prerendered.** Every route was checked in a running dev server,
not just typed-and-built.

## Why this migration, and why it took this long

`frontend/` was not a stub: 176 test files, 2429 passing tests, ~180
components, 5-locale i18n, real Freighter wallet integration. Every
dashboard page pulled in a deep chain of shared components and services —
porting one page faithfully meant transitively porting a large slice of
that chain too. `GameLobby` alone pulled in 20+ direct component
dependencies and several nested services (`WalletSessionService`,
`network-guard-middleware`, `typed-api-sdk`) totaling well over 5,000 lines
once everything it touches is counted. The full `components/v1/*` catalog
(~241 components) was ported in themed batches over the course of the
migration — empty/loading/error states, alerts/notifications, contract/audit
surfaces, wallet/balance widgets, list/filter/table controls, session and
confirmation flows, and quest/progression components, plus everything
`GameLobby`, `Portfolio`, and `ProfileSettings` needed directly.

Every shared-chrome piece (`AppSidebar`, `CommandPalette`,
`NotificationCenter`, `LocaleSwitcher`, `BreadCrumbs`,
`FeatureFlagsProvider`, `ModalStackProvider`), the full state layer
(`GlobalStateStore`, `errorStore`, `WalletSessionService`,
`network-guard-middleware`, `typed-api-sdk`'s `ApiClient`), every type
catalog those depend on, and the entire `components/v1/*` catalog were
ported. Self-hosted fonts (`next/font`, zero requests to
fonts.googleapis.com — `frontend/` used the CDN `<link>` approach) and
`@stellarcade/tokens` wiring are in place. New UI beyond the direct port —
the landing page rebuild, the cinematic footer, the mesh background, the
FAQ card list, `/verify`, `/cleanup`, `/about` — is built on Tailwind v4 +
shadcn/21st.dev primitives (`components.json` configured in this app),
established partway through the migration once that pattern proved out on
the first batch of shared components.

**Full history**: `git log --stat` on this repo's `feat(web):` / `port` /
`fix(web):` commits on the `feature/nextjs-web-migration` branch.

## Real bugs found and fixed during the port (not present in frontend/)

1. **Next's bundler (Turbopack) doesn't resolve an explicit `.js` extension**
   pointing at a `.ts`/`.tsx` source file, the way Vite/Vitest and Node ESM
   do. Every relative import across `apps/web` had to drop the extension.
2. **React 19 handles the `inert` boolean attribute differently than React
   18** — several components needed a real `inert={boolean}` prop instead
   of the `inert: ""` string hack React 18 needed.
3. **`jsdom` (this project's test environment) doesn't implement
   `scrollIntoView` at all** — `frontend/` used `happy-dom`, which
   polyfills it. Stubbed in `vitest.setup.ts`. The same stub file later
   needed a `matchMedia` shim too, for `gsap`'s `ScrollTrigger` (used by the
   cinematic footer).
4. **`waitFor` deadlocks against `vi.useFakeTimers()`** in
   `QueueHealthWidget.test.tsx`'s auto-refresh test — `waitFor`'s own
   polling uses real timers, so nothing ever un-froze fake time between
   polls. Fixed by asserting directly inside `act()` after
   `advanceTimersByTime` instead of wrapping in `waitFor`.
5. **`GameLobby.test.tsx`'s `vi.mock()` calls used stale `frontend/`-relative
   paths** that didn't match the new file layout, so two of three mocks
   silently failed to intercept the real modules — 11 of 12 tests passed
   anyway, masking the bug until the one test that actually depended on
   mock-driven state transitions failed. Don't trust "11/12 passed" as
   "basically fine" — the one failure was pointing at a real, structural
   problem.
6. **`DataTable.tsx`'s bare `JSX.Element` return type doesn't resolve**
   under this project's TS/React 19 setup — changed to `React.JSX.Element`.
7. **A CSS cascade-layers bug broke shadcn button text colors**: an
   unlayered `a { color: inherit }` rule in `globals.css` beat every
   Tailwind utility class regardless of specificity, since unlayered rules
   always win over layered ones per the CSS spec. Fixed by wrapping the
   app's base styles in `@layer base` so they participate in the same
   cascade Tailwind's utilities are designed to override.
8. **An invalid `ContractErrorCode` cast in `errorMapper.ts`**:
   `pattern_puzzle`'s error map assigned slot 4 to `"CONTRACT_NOT_FOUND"`, a
   code that doesn't exist in the type union — the `as` cast hid it from
   TypeScript, but severity/message lookups for it were `undefined` at
   runtime. Removed the invalid entry so it falls through to the existing
   `CONTRACT_UNKNOWN` default.
9. **A dead `/games` link** on the landing page and in `Portfolio`'s
   callback props — no such route exists; both now point at `/app`, which
   serves both the lobby and games concern.
10. `requestAnimationFrame`-driven canvas animation (the neon-mesh
    background) cannot be verified by pixel-sampling in a headless/
    non-displayed browser context — confirmed directly with a bare rAF
    probe that also never fired. Not a bug, but worth knowing if a future
    change to that component seems to "not animate" in an automated check.

Finding #5 is the one most worth remembering: a wrong `vi.mock()` path
doesn't error, it just silently no-ops, and most assertions can still pass
by coincidence.

## Note for future work in this repo

If you're an agent picking this repo back up: **check `git log --oneline -5
-- <file>` before editing any file that might already be ported.** During
the final push of this migration, two already-completed shadcn/21st.dev
ports got silently reverted back to their pre-port hand-rolled versions by
a re-run of the porting task that didn't check existing history first
(`ConfirmationDialog.tsx` back to a manual focus-trap implementation,
`errorMapper.ts` briefly gutted to a 68-line stub that broke the build).
Both were caught and fixed, but it's a real failure mode worth guarding
against explicitly, not just something that happened once.
