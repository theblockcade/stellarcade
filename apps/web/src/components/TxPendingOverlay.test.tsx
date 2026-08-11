import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { TxPendingOverlay } from "./TxPendingOverlay";

describe("TxPendingOverlay", () => {
  it("renders pending message and handles cancel action", () => {
    const onCancel = vi.fn();
    render(
      <TxPendingOverlay
        visible={true}
        message="Submitting move to Soroban ledger..."
        txHash="CA3B981F42E7A9124D89E34510AB"
        onCancel={onCancel}
      />
    );

    expect(screen.getByText("Submitting move to Soroban ledger...")).toBeInTheDocument();
    expect(screen.getByText(/Tx:/)).toBeInTheDocument();

    const cancelBtn = screen.getByTestId("tx-pending-overlay-cancel");
    fireEvent.click(cancelBtn);
    expect(onCancel).toHaveBeenCalled();
  });
});
