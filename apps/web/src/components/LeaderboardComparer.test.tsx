import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { LeaderboardComparer } from "./LeaderboardComparer";

describe("LeaderboardComparer", () => {
  it("renders player comparison and handles swapping", () => {
    const onPlayerChange = vi.fn();
    render(
      <LeaderboardComparer
        availablePlayers={[
          { id: "p1", name: "Alpha", rank: 1, stats: { winRate: "85%" } },
          { id: "p2", name: "Beta", rank: 2, stats: { winRate: "72%" } },
        ]}
        metrics={[{ key: "winRate", label: "Win Rate" }]}
        onPlayerChange={onPlayerChange}
      />
    );

    expect(screen.getByText("Rank #1")).toBeInTheDocument();
    expect(screen.getByText("Rank #2")).toBeInTheDocument();
    expect(screen.getByText("85%")).toBeInTheDocument();
    expect(screen.getByText("72%")).toBeInTheDocument();

    const swapBtn = screen.getByTestId("leaderboard-comparer-swap-button");
    fireEvent.click(swapBtn);
    expect(onPlayerChange).toHaveBeenCalled();
  });
});
