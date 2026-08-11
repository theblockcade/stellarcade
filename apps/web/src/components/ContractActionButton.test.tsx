import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { ContractActionButton } from "./ContractActionButton";

describe("ContractActionButton", () => {
  it("renders button and triggers action when enabled and connected", async () => {
    const action = vi.fn().mockResolvedValue({ txHash: "0x123" });
    const onSuccess = vi.fn();

    render(
      <ContractActionButton
        label="Deposit XLM"
        action={action}
        walletConnected={true}
        networkSupported={true}
        onSuccess={onSuccess}
      />
    );

    const btn = screen.getByTestId("contract-action-button");
    expect(btn).toHaveTextContent("Deposit XLM");
    fireEvent.click(btn);

    await waitFor(() => {
      expect(action).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalledWith({ txHash: "0x123" });
    });
  });

  it("disables button and shows precondition when wallet is disconnected", () => {
    const action = vi.fn();
    render(
      <ContractActionButton
        label="Deposit XLM"
        action={action}
        walletConnected={false}
        networkSupported={true}
      />
    );

    const btn = screen.getByTestId("contract-action-button");
    expect(btn).toBeDisabled();
    expect(screen.getByText("Connect wallet to continue.")).toBeInTheDocument();
  });
});
