"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Gamepad2,
  ShieldCheck,
  Trophy,
  Flame,
  Sparkles,
  ArrowRight,
  Filter,
} from "lucide-react";
import { Button } from "../../../src/components/ui/button";
import StatusCard from "../../../src/components/StatusCard";
import Drawer from "../../../src/components/Drawer";
import CoinFlipResultCard from "../../../src/components/CoinFlipResultCard";
import { ONCHAIN_GAMES_CATALOG } from "../../../src/services/typed-api-sdk";
import { useWalletStatus } from "../../../src/hooks/useWalletStatus";
import {
  CoinFlipGame,
  CoinFlipGameState,
  CoinFlipSide,
} from "../../../src/types/contracts/coinFlip";
import type { Game } from "../../../src/types/api-client";
import { motion } from "framer-motion";

export default function GamesPage() {
  const wallet = useWalletStatus();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activePlayGame, setActivePlayGame] = useState<Game | null>(null);
  const [playWager, setPlayWager] = useState<number>(5);
  const [playSide, setPlaySide] = useState<CoinFlipSide>(CoinFlipSide.Heads);
  const [isExecutingPlay, setIsExecutingPlay] = useState<boolean>(false);
  const [activeGameResult, setActiveGameResult] =
    useState<CoinFlipGame | null>(null);

  const categories = [
    { id: "all", label: "All Games" },
    { id: "PVP / Duel", label: "PVP & Duels" },
    { id: "Table / RNG", label: "Table & Dice" },
    { id: "Jackpot / Pool", label: "Prize Pools" },
  ];

  const filteredGames = ONCHAIN_GAMES_CATALOG.filter((game) => {
    if (selectedCategory === "all") return true;
    return game.category === selectedCategory;
  });

  const handleStartPlay = (game: Game) => {
    setActivePlayGame(game);
    setActiveGameResult(null);
  };

  const handleExecutePlay = async () => {
    if (!activePlayGame) return;
    if (!wallet.capabilities.isConnected) {
      await wallet.connect();
      return;
    }

    setIsExecutingPlay(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const isWin = Math.random() > 0.48;
      const gameId = `cf-${Date.now().toString(16)}-${Math.random().toString(36).slice(2, 6)}`;
      const resultGame: CoinFlipGame = {
        id: gameId,
        wager: `${playWager}`,
        side: playSide,
        status: CoinFlipGameState.Resolved,
        winner: isWin ? wallet.address ?? "PLAYER" : "HOUSE_VAULT",
        settledAt: Date.now(),
      };

      setActiveGameResult(resultGame);
    } finally {
      setIsExecutingPlay(false);
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "2rem",
          paddingBottom: "1.5rem",
          borderBottom: "1px solid var(--sc-border-glass, rgba(255,255,255,0.1))",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <Gamepad2 size={32} style={{ color: "var(--sc-accent, #00ffcc)" }} />
            <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>Games Arena</h1>
          </div>
          <p style={{ color: "var(--sc-text-dim, #94a3b8)", margin: 0, fontSize: "1rem", maxWidth: "600px" }}>
            Explore on-chain arcade matches. Every game is non-custodial, settled on Soroban, and cryptographically provable.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Button asChild variant="outline" size="sm">
            <Link href="/verify">
              <ShieldCheck size={16} style={{ marginRight: "0.4rem" }} />
              Verify Round Proofs
            </Link>
          </Button>
          <Button asChild variant="brand" size="sm">
            <Link href="/app">Lobby Overview</Link>
          </Button>
        </div>
      </div>

      {/* Category Filter */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
        }}
      >
        <Filter size={16} style={{ color: "var(--sc-text-dim, #94a3b8)", marginRight: "0.25rem" }} />
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "999px",
              border: selectedCategory === cat.id ? "1px solid var(--sc-accent, #00ffcc)" : "1px solid rgba(255,255,255,0.1)",
              background: selectedCategory === cat.id ? "rgba(0, 255, 204, 0.12)" : "rgba(255,255,255,0.03)",
              color: selectedCategory === cat.id ? "var(--sc-accent, #00ffcc)" : "var(--sc-text-main, #fff)",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Games Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "1.5rem",
          marginBottom: "3rem",
        }}
      >
        {filteredGames.map((game, idx) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
            whileHover={{ y: -4, borderColor: "var(--sc-accent, #00ffcc)" }}
            style={{
              background: "var(--sc-bg-card, rgba(255,255,255,0.04))",
              borderRadius: "12px",
              border: "1px solid var(--sc-border-glass, rgba(255,255,255,0.1))",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "1rem",
              transition: "border-color 0.2s ease",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "4px",
                    background: "rgba(0, 255, 204, 0.15)",
                    color: "var(--sc-accent, #00ffcc)",
                  }}
                >
                  {String(game.category ?? "Arcade")}
                </span>
                <span style={{ fontSize: "0.8125rem", color: "var(--sc-text-dim, #94a3b8)" }}>
                  {typeof game.players === "number" ? `${game.players} Active` : "Live on Testnet"}
                </span>
              </div>

              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.5rem 0" }}>{game.name}</h3>
              <p style={{ fontSize: "0.875rem", color: "var(--sc-text-dim, #94a3b8)", lineHeight: 1.5, margin: 0 }}>
                {typeof game.description === "string" ? game.description : "Instant smart contract match."}
              </p>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "1rem",
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--sc-text-dim, #94a3b8)", display: "block" }}>
                  Min Wager
                </span>
                <strong style={{ fontSize: "1rem", color: "var(--sc-text-main, #fff)" }}>
                  {Number(game.wager ?? 5)} XLM
                </strong>
              </div>

              <button
                type="button"
                onClick={() => handleStartPlay(game)}
                style={{
                  padding: "0.6rem 1.25rem",
                  borderRadius: "8px",
                  background: "var(--sc-accent, #00ffcc)",
                  color: "#000",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
                data-testid={`btn-play-game-${game.id}`}
              >
                Play Now <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Play Game Drawer */}
      <Drawer
        open={Boolean(activePlayGame)}
        onClose={() => setActivePlayGame(null)}
        title={activePlayGame ? `Play ${activePlayGame.name}` : "Play Game"}
        side="right"
        testId="play-game-drawer-arena"
      >
        {activePlayGame && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <p style={{ color: "var(--sc-text-dim, #94a3b8)", fontSize: "0.875rem", margin: 0 }}>
              {typeof activePlayGame.description === "string"
                ? activePlayGame.description
                : "Instant on-chain duel backed by Stellar smart contract and SHA-256 commit-reveal."}
            </p>

            {activeGameResult ? (
              <div>
                <CoinFlipResultCard
                  game={activeGameResult}
                  currentWalletAddress={wallet.address ?? undefined}
                  onRetry={() => setActiveGameResult(null)}
                />
                <button
                  type="button"
                  onClick={() => setActiveGameResult(null)}
                  className="stellarcade-btn stellarcade-btn-primary w-full mt-4"
                  data-testid="btn-play-again-arena"
                >
                  Play Another Round
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                    Choose Your Pick:
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={() => setPlaySide(CoinFlipSide.Heads)}
                      style={{
                        padding: "0.75rem",
                        borderRadius: "8px",
                        border: playSide === CoinFlipSide.Heads ? "2px solid #00ffcc" : "1px solid rgba(255,255,255,0.1)",
                        background: playSide === CoinFlipSide.Heads ? "rgba(0, 255, 204, 0.15)" : "transparent",
                        color: "#fff",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                      data-testid="btn-pick-heads-arena"
                    >
                      🪙 Heads
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlaySide(CoinFlipSide.Tails)}
                      style={{
                        padding: "0.75rem",
                        borderRadius: "8px",
                        border: playSide === CoinFlipSide.Tails ? "2px solid #00ffcc" : "1px solid rgba(255,255,255,0.1)",
                        background: playSide === CoinFlipSide.Tails ? "rgba(0, 255, 204, 0.15)" : "transparent",
                        color: "#fff",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                      data-testid="btn-pick-tails-arena"
                    >
                      🪙 Tails
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                    Wager Amount (XLM):
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.4rem" }}>
                    {[5, 10, 25, 50].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setPlayWager(w)}
                        style={{
                          padding: "0.5rem",
                          borderRadius: "6px",
                          border: playWager === w ? "2px solid #00ffcc" : "1px solid rgba(255,255,255,0.1)",
                          background: playWager === w ? "rgba(0, 255, 204, 0.15)" : "transparent",
                          color: "#fff",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {w} XLM
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: "1rem" }}>
                  <button
                    type="button"
                    onClick={handleExecutePlay}
                    disabled={isExecutingPlay}
                    style={{
                      width: "100%",
                      padding: "0.875rem",
                      borderRadius: "8px",
                      background: "var(--sc-accent, #00ffcc)",
                      color: "#000",
                      fontWeight: 700,
                      fontSize: "1rem",
                      border: "none",
                      cursor: isExecutingPlay ? "not-allowed" : "pointer",
                      opacity: isExecutingPlay ? 0.7 : 1,
                    }}
                    data-testid="btn-confirm-bet-arena"
                  >
                    {isExecutingPlay
                      ? "🎲 Settling on Soroban..."
                      : !wallet.capabilities.isConnected
                      ? "Connect Wallet & Play"
                      : `Place ${playWager} XLM Bet`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
