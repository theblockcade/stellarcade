import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { NoResultsStateShell } from "./NoResultsStateShell";

describe("NoResultsStateShell", () => {
  it("renders active filters and clears filter on click", () => {
    const onClearFilter = vi.fn();
    const onClearAll = vi.fn();

    render(
      <NoResultsStateShell
        filters={[
          { id: "f1", label: "Status", value: "Active" },
          { id: "f2", label: "Category", value: "Arcade" },
        ]}
        onClearFilter={onClearFilter}
        onClearAll={onClearAll}
      />
    );

    expect(screen.getByText("No matches found")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();

    const clearBtn = screen.getByTestId("no-results-state-shell-clear-f1");
    fireEvent.click(clearBtn);
    expect(onClearFilter).toHaveBeenCalledWith("f1");

    const clearAllBtn = screen.getByTestId("no-results-state-shell-clear-all");
    fireEvent.click(clearAllBtn);
    expect(onClearAll).toHaveBeenCalled();
  });
});
