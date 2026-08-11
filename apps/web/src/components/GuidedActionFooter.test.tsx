import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { GuidedActionFooter } from "./GuidedActionFooter";

describe("GuidedActionFooter", () => {
  it("renders primary and secondary guided actions and fires click handler", () => {
    const onPrimary = vi.fn();
    const onSecondary = vi.fn();

    render(
      <GuidedActionFooter
        primaryAction={{ label: "Confirm Transaction", onClick: onPrimary }}
        secondaryAction={{ label: "Back", onClick: onSecondary }}
      />
    );

    expect(screen.getByText("Confirm Transaction")).toBeInTheDocument();
    expect(screen.getByText("Back")).toBeInTheDocument();

    const primaryBtn = screen.getByTestId("guided-action-footer-primary-btn");
    fireEvent.click(primaryBtn);
    expect(onPrimary).toHaveBeenCalled();
  });
});
