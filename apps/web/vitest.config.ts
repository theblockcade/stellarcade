import { defineConfig } from "vitest/config";

export default defineConfig({
  // tsconfig.json sets jsx:"preserve" (Next's SWC compiler needs that) —
  // override it here so Vitest's esbuild transform still converts JSX to
  // React.createElement instead of leaving it untransformed.
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // Matches frontend/vitest.config.ts's `globals: true` — most ported
    // test files come from there and rely on describe/it/expect/vi as
    // ambient globals rather than importing them from "vitest". Keeping
    // this in sync avoids editing every ported test file's imports.
    globals: true,
    exclude: ["node_modules", "e2e/**"],
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});
