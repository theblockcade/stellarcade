import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { RecentActivityPivotCard } from "./RecentActivityPivotCard";

describe("RecentActivityPivotCard", () => {
  it("renders audit and wallet items and switches tabs", () => {
    const onViewChange = vi.fn();
    render(
      <RecentActivityPivotCard
        activeView="audit"
        onViewChange={onViewChange}
        auditItems={[{ id: "1", label: "Contract Invocation", summary: "Success: transfer 50 XLM" }]}
        walletItems={[{ id: "2", label: "Signed Tx", summary: "Hash: 0x987..." }]}
      />
    );

    expect(screen.getByText("Contract Invocation")).toBeInTheDocument();
    expect(screen.getByText("Success: transfer 50 XLM")).toBeInTheDocument();

    const walletTab = screen.getByTestId("recent-activity-pivot-card-tab-wallet");
    fireEvent.click(walletTab);
    expect(onViewChange).toHaveBeenCalledWith("wallet");
  });
});
