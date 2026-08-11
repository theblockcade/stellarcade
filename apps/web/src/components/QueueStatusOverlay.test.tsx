import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { QueueStatusOverlay } from "./QueueStatusOverlay";

describe("QueueStatusOverlay", () => {
  it("renders overlay with timer and cancel button", () => {
    const onCancel = vi.fn();
    render(
      <QueueStatusOverlay
        isOpen={true}
        queueName="Coin Flip High Stakes"
        durationSeconds={45}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText("Coin Flip High Stakes")).toBeInTheDocument();
    expect(screen.getByText("00:45")).toBeInTheDocument();

    const cancelBtn = screen.getByTestId("queue-status-overlay-cancel");
    fireEvent.click(cancelBtn);
    expect(onCancel).toHaveBeenCalled();
  });
});
