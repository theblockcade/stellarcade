# Design

The single source of truth for shared visual tokens is
[`packages/tokens`](../packages/tokens). This document explains what's
there, why, and the drift found while writing it down.

## Where the tokens actually live today

`frontend/src/index.css`'s `:root` block defines the app-wide baseline:

```css
--font-family: "Outfit", sans-serif;
--bg-dark: #050505;
--bg-card: rgba(255, 255, 255, 0.05);
--accent: #00ffcc;
--accent-glow: rgba(0, 255, 204, 0.4);
--text-main: #ffffff;
--text-dim: #a0a0a0;
--glass-border: rgba(255, 255, 255, 0.1);
```

A dark, glassmorphic UI with a neon cyan/green accent. `packages/tokens`
mirrors these exactly (see `src/colors.ts`), plus tests that read this file
directly and fail if the two ever diverge.

## Beyond the root: ~300 component-scoped tokens

A scan of `frontend/src/components/**/*.css` turns up roughly 300 CSS
custom property definitions, most namespaced per component:
`--cef-*` (ContractEventFeed?), `--chr-*` (ContractHealthRibbon), `--csg-*`
(a stats-grid component), `--alert-*`, `--card-*`, `--draft-*`, and more.

**Most of these are legitimately component-local and should stay that
way** — `packages/tokens` deliberately does not try to absorb them all.
Turning every scoped token into a global one would just move the sprawl
rather than fix it.

## The real problem found: semantic color drift

Four different components define an "error red," and they don't agree:

| Token | Value | Source |
|---|---|---|
| `--alert-error-border` | `#ef4444` (Tailwind red-500) | alert/toast component |
| `--cef-error` | `#f87171` (Tailwind red-400) | event feed component |
| `--edp-error-border` | `#f87171` (Tailwind red-400) | (another component) |
| `--wpr-error-border` | `#f87171` (Tailwind red-400) | (another component) |
| `--form-error-border` | `#dc3545` (Bootstrap danger) | form component |

Same is likely true of warning/success/info — not exhaustively checked.
`packages/tokens` picked `--alert-*`'s values as canonical (`colors.semantic`)
since it's the most broadly-referenced naming, and documents the drift
rather than silently picking a winner and hiding the disagreement.

**This is not fixed.** Reconciling it means either standardizing every
component on `packages/tokens`' semantic values (a real, if mechanical,
refactor across many files) or deciding the variation is intentional
(unlikely, given `#dc3545` is a Bootstrap color in an otherwise
Tailwind-flavored app — that one especially looks like copy-paste drift,
not a decision). Whoever picks this up next: start with `docs/design.md`
(this file) and `packages/tokens/src/colors.ts`'s comments, they have the
specifics.

## Adopting `packages/tokens` in the frontend

Not done yet — see `packages/tokens/README.md`'s note on why (no monorepo
tooling wires `packages/` to `frontend/` yet). The path once that exists:

1. `frontend` depends on `@stellarcade/tokens`
2. `frontend/src/index.css`'s `:root` block imports `tokens.css` instead of
   redefining the same values
3. Component CSS keeps its local tokens, but any of them that duplicate a
   global one (the error-red drift above) get pointed at the shared token
   instead

## Non-goals

This document is about tokens (color, type), not components. A
`packages/ui` primitives package is a separate, larger effort — see
`ANTIGRAVITY-BUILD-PROMPT.md` for that plan. Nothing here should be read as
"the design system is done."
