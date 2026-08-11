import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { WalletBalanceDeltaCards } from "./WalletBalanceDeltaCards";

describe("WalletBalanceDeltaCards", () => {
  it("renders balance comparisons and deltas", () => {
    render(
      <WalletBalanceDeltaCards
        left={{ id: "main", label: "Primary Account", currentBalance: 150, previousBalance: 120 }}
        right={{ id: "sponsor", label: "Sponsor Escrow", currentBalance: 500, previousBalance: 500 }}
      />
    );

    expect(screen.getByText("Primary Account")).toBeInTheDocument();
    expect(screen.getByText("150.00 XLM")).toBeInTheDocument();
    expect(screen.getByText("Sponsor Escrow")).toBeInTheDocument();
    expect(screen.getByText("500.00 XLM")).toBeInTheDocument();
  });
});
