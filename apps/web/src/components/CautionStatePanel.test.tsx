import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { CautionStatePanel } from "./CautionStatePanel";

describe("CautionStatePanel", () => {
  it("renders caution panel with action and dismiss triggers", () => {
    const onAction = vi.fn();
    const onDismiss = vi.fn();

    render(
      <CautionStatePanel
        variant="blocked-wallet"
        title="Wallet Frozen"
        description="Your wallet requires re-authentication."
        actions={[{ label: "Re-authenticate", onAction, variant: "primary" }]}
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByText("Wallet Frozen")).toBeInTheDocument();
    expect(screen.getByText("Your wallet requires re-authentication.")).toBeInTheDocument();

    const actionBtn = screen.getByText("Re-authenticate");
    fireEvent.click(actionBtn);
    expect(onAction).toHaveBeenCalled();

    const dismissBtn = screen.getByTestId("caution-state-panel-dismiss");
    fireEvent.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalled();
  });
});
