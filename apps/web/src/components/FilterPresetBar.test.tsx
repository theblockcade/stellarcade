import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { FilterPresetBar } from "./FilterPresetBar";

describe("FilterPresetBar", () => {
  it("saves, displays, and applies a preset", () => {
    const onApply = vi.fn();
    render(
      <FilterPresetBar
        scope="games"
        currentFilters={{ status: "live" }}
        onApply={onApply}
      />
    );

    const input = screen.getByTestId("filter-preset-bar-name-input");
    fireEvent.change(input, { target: { value: "Live Games" } });

    const saveBtn = screen.getByTestId("filter-preset-bar-save-btn");
    fireEvent.click(saveBtn);

    expect(screen.getByText("Live Games")).toBeInTheDocument();

    const applyBtn = screen.getByText("Live Games");
    fireEvent.click(applyBtn);
    expect(onApply).toHaveBeenCalled();
  });
});
