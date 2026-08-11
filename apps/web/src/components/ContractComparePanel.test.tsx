import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ContractComparePanel, type ContractMetricSnapshot } from "./ContractComparePanel";

const LEFT: ContractMetricSnapshot = {
  contractId: "c-1",
  label: "Coin Flip V1",
  metrics: [
    { label: "Total Volume", value: 1000, unit: "XLM" },
    { label: "Latency", value: 120, unit: "ms" },
  ],
};

const RIGHT: ContractMetricSnapshot = {
  contractId: "c-2",
  label: "Coin Flip V2",
  metrics: [
    { label: "Total Volume", value: 2500, unit: "XLM" },
    { label: "Latency", value: 45, unit: "ms" },
  ],
};

describe("ContractComparePanel", () => {
  it("renders side by side contract metric comparisons", () => {
    render(<ContractComparePanel left={LEFT} right={RIGHT} />);
    expect(screen.getByText("Coin Flip V1")).toBeInTheDocument();
    expect(screen.getByText("Coin Flip V2")).toBeInTheDocument();
    expect(screen.getByText("Total Volume")).toBeInTheDocument();
    expect(screen.getByText("1000 XLM")).toBeInTheDocument();
    expect(screen.getByText("2500 XLM")).toBeInTheDocument();
  });

  it("renders empty state when no contracts are selected", () => {
    render(<ContractComparePanel left={null} right={null} />);
    expect(screen.getByText("Select two contracts to compare.")).toBeInTheDocument();
  });
});
