import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { WalletContractHealthChips, type HealthChipSurface } from "./WalletContractHealthChips";

const SURFACES: HealthChipSurface[] = [
  { id: "wallet", label: "Wallet", status: "connected", detail: "GAB...123" },
  { id: "prizepool", label: "PrizePool", status: "active" },
  { id: "arbiter", label: "Arbiter", status: "paused" },
];

describe("WalletContractHealthChips", () => {
  it("renders status chips with correct tones", () => {
    render(<WalletContractHealthChips surfaces={SURFACES} />);
    expect(screen.getByText("Wallet")).toBeInTheDocument();
    expect(screen.getByText("PrizePool")).toBeInTheDocument();
    expect(screen.getByText("Arbiter")).toBeInTheDocument();
    expect(screen.getByText("connected")).toBeInTheDocument();
    expect(screen.getByText("paused")).toBeInTheDocument();
  });
});
