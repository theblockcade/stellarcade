/**
 * @vitest-environment happy-dom
 */

import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import HeadingHierarchyRegion, {
  RegionHeading,
} from "@/components/v1/HeadingHierarchyRegion";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("HeadingHierarchyRegion (#831)", () => {
  it("RegionHeading outside any region falls back to <h2>", () => {
    render(<RegionHeading data-testid="h">Outside</RegionHeading>);
    expect(screen.getByTestId("h").tagName).toBe("H2");
  });

  it("the root region (level=1) renders its inner heading as <h2>", () => {
    render(
      <HeadingHierarchyRegion level={1}>
        <RegionHeading data-testid="h">Section</RegionHeading>
      </HeadingHierarchyRegion>
    );
    // level=1 declares the *parent* level so children render at h2.
    expect(screen.getByTestId("h").tagName).toBe("H2");
  });

  it("nested regions step the level down by one each time", () => {
    render(
      <HeadingHierarchyRegion level={1}>
        <RegionHeading data-testid="h2">Outer</RegionHeading>
        <HeadingHierarchyRegion>
          <RegionHeading data-testid="h3">Mid</RegionHeading>
          <HeadingHierarchyRegion>
            <RegionHeading data-testid="h4">Inner</RegionHeading>
          </HeadingHierarchyRegion>
        </HeadingHierarchyRegion>
      </HeadingHierarchyRegion>
    );
    expect(screen.getByTestId("h2").tagName).toBe("H2");
    expect(screen.getByTestId("h3").tagName).toBe("H3");
    expect(screen.getByTestId("h4").tagName).toBe("H4");
  });

  it("caps the heading level at h6 even when nesting goes deeper", () => {
    render(
      <HeadingHierarchyRegion level={6}>
        <HeadingHierarchyRegion>
          <RegionHeading data-testid="h">Deep</RegionHeading>
        </HeadingHierarchyRegion>
      </HeadingHierarchyRegion>
    );
    expect(screen.getByTestId("h").tagName).toBe("H6");
  });

  it("levelOverride on RegionHeading wins over the context", () => {
    render(
      <HeadingHierarchyRegion level={1}>
        <RegionHeading levelOverride={5} data-testid="h">
          Manual
        </RegionHeading>
      </HeadingHierarchyRegion>
    );
    expect(screen.getByTestId("h").tagName).toBe("H5");
  });

  it("warns in dev when a nested region skips a heading level", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(
      <HeadingHierarchyRegion level={1}>
        {/* Parent context expects next=h2; skipping to level=4 should warn */}
        <HeadingHierarchyRegion level={4}>
          <RegionHeading data-testid="h">Skipped</RegionHeading>
        </HeadingHierarchyRegion>
      </HeadingHierarchyRegion>
    );
    expect(warn).toHaveBeenCalled();
    expect(warn.mock.calls[0]?.[0]).toMatch(/skips a level/);
  });

  it("uses <section> by default and forwards className/role", () => {
    render(
      <HeadingHierarchyRegion level={1} className="dash-region" role="region">
        <RegionHeading>Inner</RegionHeading>
      </HeadingHierarchyRegion>
    );
    const wrapper = screen.getByRole("region");
    expect(wrapper.tagName).toBe("SECTION");
    expect(wrapper).toHaveClass("dash-region");
    expect(wrapper).toHaveAttribute("data-heading-level", "2");
  });
});
