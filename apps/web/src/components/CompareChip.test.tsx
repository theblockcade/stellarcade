import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { CompareChip } from "./CompareChip";

describe("CompareChip", () => {
  it("renders label and value and toggles selection", () => {
    const onSelect = vi.fn();
    render(
      <CompareChip
        id="c1"
        label="Soroban TX Fee"
        value="0.0001 XLM"
        isSelected={false}
        onSelect={onSelect}
      />
    );

    expect(screen.getByText("Soroban TX Fee")).toBeInTheDocument();
    expect(screen.getByText("0.0001 XLM")).toBeInTheDocument();

    const chip = screen.getByTestId("compare-chip");
    fireEvent.click(chip);
    expect(onSelect).toHaveBeenCalledWith("c1", true);
  });
});
