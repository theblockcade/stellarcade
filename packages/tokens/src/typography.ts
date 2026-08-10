/**
 * Extracted from `frontend/src/index.css`'s `--font-family`. The frontend
 * currently defines only this one global font token — component-scoped
 * CSS (e.g. `--cef-font-mono`) layers monospace fonts on top for specific
 * widgets, which stay local rather than becoming global tokens here since
 * they're intentionally narrow (code/data display), not part of the base
 * type system.
 */
export const typography = {
  fontFamily: {
    base: '"Outfit", sans-serif',
    mono: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
  },
} as const;

export type TypographyTokens = typeof typography;
