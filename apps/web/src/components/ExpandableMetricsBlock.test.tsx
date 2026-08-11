import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { ExpandableMetricsBlock } from "./ExpandableMetricsBlock";

describe("ExpandableMetricsBlock", () => {
  it("renders primary metrics and expands to reveal secondary metrics", () => {
    const onToggle = vi.fn();
    render(
      <ExpandableMetricsBlock
        title="Ledger Telemetry"
        primaryMetrics={[{ id: "1", label: "Gas Used", value: "2.4M" }]}
        expandedMetrics={[{ id: "2", label: "Compute Units", value: "850K" }]}
        onToggle={onToggle}
      />
    );

    expect(screen.getByText("Ledger Telemetry")).toBeInTheDocument();
    expect(screen.getByText("Gas Used")).toBeInTheDocument();
    expect(screen.getByText("2.4M")).toBeInTheDocument();

    const toggleBtn = screen.getByRole("button", { name: /Show 1 more/i });
    fireEvent.click(toggleBtn);
    expect(onToggle).toHaveBeenCalledWith(true);
    expect(screen.getByText("Compute Units")).toBeInTheDocument();
  });
});
