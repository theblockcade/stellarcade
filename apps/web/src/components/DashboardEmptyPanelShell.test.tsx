import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { DashboardEmptyPanelShell } from "./DashboardEmptyPanelShell";

describe("DashboardEmptyPanelShell", () => {
  it("renders empty panel and handles action click", () => {
    const onAction = vi.fn();
    render(
      <DashboardEmptyPanelShell
        title="No Live Tables"
        description="Connect to Stellar network to view active lobbies."
        actionLabel="Join Queue"
        onAction={onAction}
      />
    );

    expect(screen.getByText("No Live Tables")).toBeInTheDocument();
    expect(screen.getByText("Connect to Stellar network to view active lobbies.")).toBeInTheDocument();

    const actionBtn = screen.getByText("Join Queue");
    fireEvent.click(actionBtn);
    expect(onAction).toHaveBeenCalled();
  });
});
