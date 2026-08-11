import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { RecentSurfaceShortcuts } from "./RecentSurfaceShortcuts";

describe("RecentSurfaceShortcuts", () => {
  it("renders surface shortcuts and handles selection", () => {
    const onSelect = vi.fn();
    render(
      <RecentSurfaceShortcuts
        surfaceKind="wallet"
        items={[
          { id: "w1", label: "Player Alpha", hint: "GD6X...91PQ" },
        ]}
        onSelect={onSelect}
      />
    );

    expect(screen.getByText("Recent wallets")).toBeInTheDocument();
    expect(screen.getByText("Player Alpha")).toBeInTheDocument();
    expect(screen.getByText("GD6X...91PQ")).toBeInTheDocument();

    const item = screen.getByTestId("recent-surface-shortcuts-item-w1");
    fireEvent.click(item);
    expect(onSelect).toHaveBeenCalled();
  });
});
