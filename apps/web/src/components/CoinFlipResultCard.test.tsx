import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { CoinFlipResultCard } from "./CoinFlipResultCard";
import { CoinFlipGameState, CoinFlipSide } from "../types/contracts/coinFlip";

describe("CoinFlipResultCard", () => {
  it("renders resolved coin flip summary and win badge", () => {
    render(
      <CoinFlipResultCard
        game={{
          id: "game-101",
          wager: "100000000",
          side: CoinFlipSide.Heads,
          status: CoinFlipGameState.Resolved,
          winner: "GPLAYER12345",
        }}
        currentWalletAddress="GPLAYER12345"
      />
    );

    expect(screen.getByText("Coin Flip Summary")).toBeInTheDocument();
    expect(screen.getByText("game-101")).toBeInTheDocument();
    expect(screen.getByText("Heads")).toBeInTheDocument();
    expect(screen.getByText("🎉 You Won!")).toBeInTheDocument();
  });
});
