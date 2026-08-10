import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// @testing-library/react's auto-cleanup relies on detecting global test
// hooks; with `globals: false` in vitest.config.ts those aren't globally
// registered, so it's done explicitly here instead.
afterEach(() => {
  cleanup();
});
