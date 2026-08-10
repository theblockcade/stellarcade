# Migration status: frontend/ (Vite) → apps/web (Next.js)

Started 2026-08-10, per an explicit decision to migrate despite the framework
tradeoffs (see the note below on why Vite was originally chosen, and why
migrating was still the right call once decided). This file tracks exactly
what's been ported and what's pending — update it every time a page or
component moves.

## Why this migration, and why it's slower than "just port everything"

`frontend/` is not a stub: 176 test files, 2429 passing tests, ~180
components, 5-locale i18n, real Freighter wallet integration. Every
dashboard page (`ProfileSettings`, `Portfolio`, `GameLobby`) pulls in a deep
chain of shared components and services — porting one page faithfully means
transitively porting a large slice of that chain too. Doing that
correctly, with the same test coverage, is genuinely multi-day work, not
something to fake in a single pass. This file exists so nobody mistakes "the
scaffold exists" for "the migration is done."

## Ported (real, tested, verified)

| Piece | Status | Notes |
|---|---|---|
| App scaffold | ✅ | Next 16, React 19, TS, pnpm workspace member |
| `@stellarcade/tokens` wiring | ✅ | Same alias pattern as `frontend/src/index.css` |
| Self-hosted fonts | ✅ | `next/font/google` (Outfit) — zero requests to fonts.googleapis.com, verified via network tab; `frontend/index.html` still uses the CDN `<link>` approach |
| Landing/marketing page (`/`) | ✅ | New page — `frontend/` has no public marketing route today, this fills that gap. Statically prerendered (`next build` confirms `○ /`) |
| i18n message catalogs (en/es/fr/de/ja) | ✅ | Copied verbatim from `frontend/src/i18n/messages/` |
| `I18nProvider` | ✅ | Ported from `frontend/src/i18n/provider.tsx`; only change is `import.meta.env.DEV` → `process.env.NODE_ENV === "development"` (Vite → Next/Node) |

Verified: `npm test` (11/11), `npm run typecheck` (clean), `npm run build`
(clean, static prerender), and a live `next dev` check — computed styles
matched the Vite app's exactly, zero console errors, zero font CDN requests.

## Not yet ported (real work remaining)

| Page/piece | Frontend size | Depends on |
|---|---|---|
| `GameLobby` (`/`, `/games` in the old app) | 1150 lines | Deep: `hooks/v1/*`, `services/soroban-contract-client`, `services/soroban-contract-dev`, many `components/v1/*` |
| `ProfileSettings` (`/profile`) | 384 lines | `AccountSwitcher`, `DraftPresenceIndicator`, `SensitiveActionChecklist`, `StickyActionsFooter`, `CollapsibleStatsGroup`, `RewardBalanceSparklineCard`, `GlobalStateStore`, `useWalletStatus` |
| `Portfolio` (`/portfolio`) | 419 lines | `EmptyStateBlock`, `BalanceHealthBadge`, `CampaignRewardsSpotlightCard`, `PinnedWalletActionTray`, `StatusPill` |
| `AppSidebar` (nav shell) | 155 lines | Route-aware, not yet ported |
| `CommandPalette`, `NotificationCenter`, `LocaleSwitcher`, `BreadCrumbs` | ~450 lines combined | Shared chrome, not yet ported |
| `FeatureFlagsProvider`, `ModalStackProvider` | ~360 lines combined | `feature-flags.tsx` uses `import.meta.env.VITE_FEATURE_FLAG_OVERRIDES` — needs a Next-appropriate env-var equivalent, not a mechanical rename |
| ~170 remaining `components/v1/*` | — | Not audited component-by-component yet |

## Suggested order for the next slice

1. `AppSidebar` + the four shared chrome components — this is the app shell,
   needed before any dashboard page can be wired into `apps/web`'s routing.
2. `FeatureFlagsProvider` — small, self-contained, needed by several pages.
3. `Portfolio` — smallest of the three dashboard pages, good next target.
4. `ProfileSettings`, then `GameLobby` last (largest, most dependencies).

## Cutover

`frontend/` stays the live app until `apps/web` has real parity — do not
point production traffic at `apps/web` before the table above is empty.
