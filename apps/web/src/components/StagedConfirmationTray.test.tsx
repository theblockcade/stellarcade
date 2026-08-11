import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { StagedConfirmationTray } from "./StagedConfirmationTray";

describe("StagedConfirmationTray", () => {
  it("progresses through review, confirm, and done stages", async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <StagedConfirmationTray
        open={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Burn Tokens"
        riskLevel="critical"
        fields={[{ label: "Burn Amount", value: "1,000 XLM" }]}
      />
    );

    expect(screen.getByText("Burn Tokens")).toBeInTheDocument();
    expect(screen.getByText("1,000 XLM")).toBeInTheDocument();

    const nextBtn = screen.getByTestId("staged-confirmation-tray-next");
    fireEvent.click(nextBtn);

    expect(screen.getByText("I understand and want to submit")).toBeInTheDocument();
    const checkbox = screen.getByTestId("staged-confirmation-tray-checkbox");
    fireEvent.click(checkbox);

    const submitBtn = screen.getByTestId("staged-confirmation-tray-submit");
    fireEvent.click(submitBtn);
    expect(onConfirm).toHaveBeenCalled();
  });
});
