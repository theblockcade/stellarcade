import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { RelatedWalletQuickLinks } from "./RelatedWalletQuickLinks";

describe("RelatedWalletQuickLinks", () => {
  it("renders related wallet address and relationship tag", () => {
    const onSelect = vi.fn();
    render(
      <RelatedWalletQuickLinks
        wallets={[
          {
            id: "1",
            address: "GBDEV7PXW5E2G8ABCDEF1234567890",
            relationship: "multisig-member",
          },
        ]}
        onSelect={onSelect}
      />
    );

    expect(screen.getByText("GBDEV7...7890")).toBeInTheDocument();
    expect(screen.getByText("Multisig")).toBeInTheDocument();

    const btn = screen.getByTestId("related-wallet-quick-links-wallet-1");
    fireEvent.click(btn);
    expect(onSelect).toHaveBeenCalledWith("1");
  });
});
