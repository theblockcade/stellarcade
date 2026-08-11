import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { InlineEmptyStateSlot } from "./InlineEmptyStateSlot";

describe("InlineEmptyStateSlot", () => {
  it("renders compact slot with message and action", () => {
    const onAction = vi.fn();
    render(
      <InlineEmptyStateSlot
        icon="🎮"
        message="No active games"
        description="Join matchmaking to begin"
        action={{ label: "Find Match", onClick: onAction }}
        size="compact"
      />
    );

    expect(screen.getByText("No active games")).toBeInTheDocument();
    expect(screen.getByText("Join matchmaking to begin")).toBeInTheDocument();

    const btn = screen.getByRole("button", { name: "Find Match" });
    fireEvent.click(btn);
    expect(onAction).toHaveBeenCalled();
  });
});
