import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { EmptyResultCallout } from "./EmptyResultCallout";

describe("EmptyResultCallout", () => {
  it("renders search query and active filters in description", () => {
    const onClear = vi.fn();
    render(
      <EmptyResultCallout
        query="coinflip"
        activeFilters={["live", "high-stakes"]}
        onClear={onClear}
      />
    );

    expect(screen.getByText("No matching results")).toBeInTheDocument();
    expect(
      screen.getByText(/No items match search "coinflip" and 2 active filters\./)
    ).toBeInTheDocument();

    const btn = screen.getByRole("button", { name: "Clear filters" });
    fireEvent.click(btn);
    expect(onClear).toHaveBeenCalled();
  });
});
