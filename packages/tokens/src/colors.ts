/**
 * Global color tokens, extracted verbatim from `frontend/src/index.css`'s
 * `:root` block — this file does not invent new values, it names the ones
 * already live in production. See docs/design.md for the semantic-color
 * drift found while extracting these (multiple different "error red"s
 * across components) and the plan to reconcile it.
 */
export const colors = {
  bg: {
    dark: "#050505",
    card: "rgba(255, 255, 255, 0.05)",
  },
  accent: {
    default: "#00ffcc",
    glow: "rgba(0, 255, 204, 0.4)",
  },
  text: {
    main: "#ffffff",
    dim: "#a0a0a0",
  },
  border: {
    glass: "rgba(255, 255, 255, 0.1)",
  },
  /**
   * The `--alert-*` semantic set (used by the app's alert/toast components)
   * is the canonical choice here — Tailwind's standard palette, and the
   * most broadly-referenced naming in the CSS scan. Several components
   * (`--cef-error`, `--edp-error-border`, `--wpr-error-*`) use a lighter
   * red (`#f87171`, Tailwind red-400) instead of this one
   * (`#ef4444`, red-500), and `--form-error-border` uses a third value
   * (`#dc3545`, Bootstrap danger) entirely. That drift is real and
   * unresolved — see docs/design.md.
   */
  semantic: {
    error: "#ef4444",
    warning: "#f59e0b",
    success: "#22c55e",
    info: "#3b82f6",
  },
} as const;

export type ColorTokens = typeof colors;
