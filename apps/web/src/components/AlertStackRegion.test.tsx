import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { AlertStackRegion } from "./AlertStackRegion";

describe("AlertStackRegion", () => {
  it("renders alerts and handles dismiss", () => {
    const onDismiss = vi.fn();
    render(
      <AlertStackRegion
        alerts={[
          { id: "a1", severity: "error", title: "Transaction Failed", message: "RPC timeout" },
        ]}
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByText("Transaction Failed")).toBeInTheDocument();
    expect(screen.getByText("RPC timeout")).toBeInTheDocument();

    const dismissBtn = screen.getByTestId("alert-stack-region-dismiss-a1");
    fireEvent.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalledWith("a1");
  });
});
