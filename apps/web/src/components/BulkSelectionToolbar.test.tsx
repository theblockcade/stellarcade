import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { BulkSelectionToolbar } from "./BulkSelectionToolbar";

describe("BulkSelectionToolbar", () => {
  it("renders selected count and triggers clear callback", () => {
    const onClear = vi.fn();
    render(
      <BulkSelectionToolbar
        selectedCount={3}
        totalCount={10}
        onClear={onClear}
      />
    );

    expect(screen.getByText("3 of 10 selected")).toBeInTheDocument();
    const clearBtn = screen.getByTestId("bulk-selection-toolbar-clear");
    fireEvent.click(clearBtn);
    expect(onClear).toHaveBeenCalled();
  });
});
