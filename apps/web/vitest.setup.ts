import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdom (this project's test environment) doesn't implement scrollIntoView
// at all — frontend/ uses happy-dom, which polyfills it. Several ported
// components call it defensively; stub it so those calls don't throw.
if (typeof window !== "undefined" && !window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = () => {};
}

// jsdom also doesn't implement matchMedia. gsap's ScrollTrigger.register()
// calls it unconditionally at module-registration time (see
// src/components/ui/motion-footer.tsx), so without this stub every test that
// renders CinematicFooter throws "matchMedia is not a function" before any
// assertion runs.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList;
}

// @testing-library/react's auto-cleanup relies on detecting global test
// hooks; with `globals: false` in vitest.config.ts those aren't globally
// registered, so it's done explicitly here instead.
afterEach(() => {
  cleanup();
});
