import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { GameLeaderboardPreviewCard } from "./GameLeaderboardPreviewCard";

describe("GameLeaderboardPreviewCard", () => {
  it("renders leaderboard preview with top players and scores", () => {
    render(
      <GameLeaderboardPreviewCard
        gameId="coinflip-v1"
        gameName="Coinflip Duel"
        entries={[
          { rank: 1, playerName: "StellarKing", score: 15400 },
          { rank: 2, playerName: "SorobanPro", score: 8200 },
        ]}
        totalPlayers={120}
      />
    );

    expect(screen.getByText("Coinflip Duel")).toBeInTheDocument();
    expect(screen.getByText("StellarKing")).toBeInTheDocument();
    expect(screen.getByText("15.4K")).toBeInTheDocument();
    expect(screen.getByText("SorobanPro")).toBeInTheDocument();
    expect(screen.getByText("8.2K")).toBeInTheDocument();
    expect(screen.getByText("120 total players")).toBeInTheDocument();
  });
});
