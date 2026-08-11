import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { FilterPillStrip } from "./FilterPillStrip";

describe("FilterPillStrip", () => {
  it("renders options and toggles active pills", () => {
    const onChange = vi.fn();
    render(
      <FilterPillStrip
        options={[
          { id: "all", label: "All Games", count: 12 },
          { id: "pvp", label: "PvP Duel", count: 5 },
        ]}
        selectedIds={["all"]}
        onChange={onChange}
      />
    );

    expect(screen.getByText("All Games")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();

    const pvpBtn = screen.getByTestId("filter-pill-strip-pill-pvp");
    fireEvent.click(pvpBtn);
    expect(onChange).toHaveBeenCalledWith(["all", "pvp"]);
  });
});
