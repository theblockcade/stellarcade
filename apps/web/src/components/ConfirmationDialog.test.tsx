import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { ConfirmationDialog } from "./ConfirmationDialog";

describe("ConfirmationDialog", () => {
  it("renders modal dialog and triggers onConfirm and onCancel", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmationDialog
        isOpen={true}
        title="Leave Matchmaking?"
        description="Your current queue spot will be relinquished."
        confirmLabel="Leave Queue"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByRole("heading", { name: "Leave Matchmaking?" })).toBeInTheDocument();
    expect(screen.getByText("Your current queue spot will be relinquished.")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("confirmation-dialog-confirm-button"));
    expect(onConfirm).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("confirmation-dialog-cancel-button"));
    expect(onCancel).toHaveBeenCalled();
  });
});
