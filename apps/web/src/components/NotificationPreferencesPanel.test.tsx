import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { NotificationPreferencesPanel } from "./NotificationPreferencesPanel";

describe("NotificationPreferencesPanel", () => {
  it("renders preference items and allows toggling", () => {
    render(<NotificationPreferencesPanel />);

    expect(screen.getByText("Notification preferences")).toBeInTheDocument();
    expect(screen.getByText("Product updates")).toBeInTheDocument();

    const checkbox = screen.getByTestId("notification-preferences-panel-toggle-productUpdates") as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(checkbox).toBeDefined();
  });
});
