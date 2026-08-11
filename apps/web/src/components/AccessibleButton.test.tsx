import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { AccessibleButton, getContrastRatio, meetsWcagAA } from "./AccessibleButton";

describe("AccessibleButton", () => {
  it("renders with accessible label and handles loading state", () => {
    render(
      <AccessibleButton label="Submit Wager" loading={true} loadingLabel="Submitting...">
        Submit
      </AccessibleButton>
    );

    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("aria-label", "Submitting...");
    expect(btn).toHaveAttribute("aria-busy", "true");
    expect(btn).toBeDisabled();
  });

  it("calculates WCAG contrast ratio correctly", () => {
    expect(getContrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(meetsWcagAA("#000000", "#ffffff")).toBe(true);
  });
});
