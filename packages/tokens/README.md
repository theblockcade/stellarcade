# @stellarcade/tokens

Design tokens for StellarCade. Not a new design system — this package
**extracts and formalizes** the global tokens already live in
`frontend/src/index.css`'s `:root` block, so they have one tested,
documented source instead of being implicitly defined only inside a CSS
file nobody imports as data.

## What's in here vs. what isn't

The frontend has ~300 CSS custom property definitions across its
components (`--cef-*`, `--chr-*`, `--csg-*`, and friends — check any file
under `frontend/src/components`). Most of those are legitimately
component-scoped and **do not belong here**. This package only carries the
handful of tokens meant to be shared app-wide: base colors, the accent,
text colors, the glass border, semantic status colors, and the two font
families in use.

## Usage

```ts
import { colors, typography } from "@stellarcade/tokens";

colors.accent.default; // "#00ffcc"
colors.semantic.error; // "#ef4444"
typography.fontFamily.base; // '"Outfit", sans-serif'
```

Or as CSS custom properties:

```css
@import "@stellarcade/tokens/css";

.thing {
  color: var(--sc-text-main);
  background: var(--sc-bg-card);
}
```

## Drift guard

`src/colors.test.ts` and `src/tokens-css.test.ts` read
`frontend/src/index.css` directly and assert these values still match it.
If someone changes a root color in the frontend without updating this
package (or vice versa), **these tests fail** — that's the point. See
[docs/design.md](../../docs/design.md) for the semantic-color drift already
found (multiple different "error red"s across components) and not yet
fixed.

## This package is not yet wired into the frontend build

The frontend is a standalone Vite app with no monorepo tooling (no root
`package.json` or `pnpm-workspace.yaml` ties it to `packages/`). This
package exists and is tested today; actually importing it from
`frontend/` requires introducing workspace tooling first — a larger,
separate change, not bundled into this one so as not to risk breaking the
working app. See `ANTIGRAVITY-BUILD-PROMPT.md` at the monorepo root for
that plan.

## Development

```bash
npm install
npm test
npm run typecheck
npm run build
```
