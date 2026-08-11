import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { CopyableWalletKeyField } from "./CopyableWalletKeyField";

describe("CopyableWalletKeyField", () => {
  it("renders key value and handles reveal toggle", () => {
    render(
      <CopyableWalletKeyField
        label="Stellar Secret Key"
        value="SBX1234567890ABC"
        masked={true}
      />
    );

    expect(screen.getByText("Stellar Secret Key")).toBeInTheDocument();
    expect(screen.getByText("****************")).toBeInTheDocument();

    const toggle = screen.getByTestId("copyable-wallet-key-toggle");
    fireEvent.click(toggle);

    expect(screen.getByText("SBX1234567890ABC")).toBeInTheDocument();
  });
});
