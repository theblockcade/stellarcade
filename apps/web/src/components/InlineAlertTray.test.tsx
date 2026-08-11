import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { InlineAlertTray } from "./InlineAlertTray";

describe("InlineAlertTray", () => {
  it("renders message and triggers action and dismiss", () => {
    const onAction = vi.fn();
    const onDismiss = vi.fn();

    render(
      <InlineAlertTray
        variant="warning"
        message="Session about to expire"
        action={{ label: "Extend", onClick: onAction }}
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByText("Session about to expire")).toBeInTheDocument();

    const actionBtn = screen.getByTestId("inline-alert-tray-action");
    fireEvent.click(actionBtn);
    expect(onAction).toHaveBeenCalled();

    const dismissBtn = screen.getByTestId("inline-alert-tray-dismiss");
    fireEvent.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalled();
  });
});
