import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ContractHealthRibbon } from "./ContractHealthRibbon";

describe("ContractHealthRibbon", () => {
  it("renders contract id, status, and latency", () => {
    render(
      <ContractHealthRibbon
        contractId="prize-pool"
        status="healthy"
        latencyMs={42}
      />
    );

    expect(screen.getByText("prize-pool")).toBeInTheDocument();
    expect(screen.getByText("Healthy")).toBeInTheDocument();
    expect(screen.getByText("42ms")).toBeInTheDocument();
  });
});
