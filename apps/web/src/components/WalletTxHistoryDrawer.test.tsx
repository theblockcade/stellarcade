import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { WalletTxHistoryDrawer, type WalletTxEntry } from "./WalletTxHistoryDrawer";

const TXS: WalletTxEntry[] = [
  {
    id: "tx-1",
    type: "buy",
    asset: "XLM",
    amount: "100",
    timestamp: new Date().toISOString(),
    status: "confirmed",
  },
];

describe("WalletTxHistoryDrawer", () => {
  it("renders transactions in drawer list", () => {
    render(
      <WalletTxHistoryDrawer
        open={true}
        onClose={vi.fn()}
        walletAddress="GAB123456789"
        transactions={TXS}
      />
    );

    expect(screen.getByText("Transaction History")).toBeInTheDocument();
    expect(screen.getByText("GAB123456789")).toBeInTheDocument();
    expect(screen.getByText("100 XLM")).toBeInTheDocument();
    expect(screen.getByText("confirmed")).toBeInTheDocument();
  });
});
