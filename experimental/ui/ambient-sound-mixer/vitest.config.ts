import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    // jsdom throws "localStorage is not available for opaque origins"
    // without an explicit URL — this component persists its config to
    // localStorage, so a real origin is required for tests to exercise it.
    environmentOptions: {
      jsdom: {
        url: "http://localhost/",
      },
    },
    // See vitest.setup.ts: installs a working localStorage, working around
    // a Node 22+ / vitest@1.x jsdom-environment interaction that otherwise
    // leaves window.localStorage undefined.
    setupFiles: ["./vitest.setup.ts"],
  },
});
