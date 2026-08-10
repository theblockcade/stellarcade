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
    globals: false,
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});
