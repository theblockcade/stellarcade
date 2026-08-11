import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { DraftRecoveryPrompt } from "./DraftRecoveryPrompt";

describe("DraftRecoveryPrompt", () => {
  it("renders draft recovery message and triggers recover/discard", () => {
    const onRecover = vi.fn();
    const onDiscard = vi.fn();

    render(
      <DraftRecoveryPrompt
        formId="custom-wager"
        formName="Custom Wager Form"
        onRecover={onRecover}
        onDiscard={onDiscard}
        draftSavedAt={Date.now() - 120000}
      />
    );

    expect(screen.getByText("Custom Wager Form")).toBeInTheDocument();
    expect(screen.getByText(/Saved 2 minutes ago/)).toBeInTheDocument();

    const recoverBtn = screen.getByTestId("draft-recovery-prompt-recover-btn");
    fireEvent.click(recoverBtn);
    expect(onRecover).toHaveBeenCalled();

    const discardBtn = screen.getByTestId("draft-recovery-prompt-discard-btn");
    fireEvent.click(discardBtn);
    expect(onDiscard).toHaveBeenCalled();
  });
});
