import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { HeadingHierarchyRegion, RegionHeading } from "./HeadingHierarchyRegion";

describe("HeadingHierarchyRegion", () => {
  it("renders correct heading hierarchy levels automatically", () => {
    render(
      <HeadingHierarchyRegion level={1}>
        <RegionHeading>Section Header</RegionHeading>
        <HeadingHierarchyRegion>
          <RegionHeading>Card Header</RegionHeading>
        </HeadingHierarchyRegion>
      </HeadingHierarchyRegion>
    );

    const sectionHeading = screen.getByRole("heading", { level: 2 });
    const cardHeading = screen.getByRole("heading", { level: 3 });

    expect(sectionHeading).toHaveTextContent("Section Header");
    expect(cardHeading).toHaveTextContent("Card Header");
  });
});
