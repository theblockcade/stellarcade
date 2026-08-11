import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ContractDetailSidebar } from "./ContractDetailSidebar";

describe("ContractDetailSidebar", () => {
  it("renders related contracts with action buttons", () => {
    render(<ContractDetailSidebar contractId="contract-123" />);
    expect(screen.getByText("Related Contracts")).toBeInTheDocument();
    expect(screen.getByText("Coin Flip V1")).toBeInTheDocument();
    expect(screen.getByText("Coin Flip V2")).toBeInTheDocument();
    expect(screen.getByText("PrizePool Multi-Asset")).toBeInTheDocument();
  });
});
