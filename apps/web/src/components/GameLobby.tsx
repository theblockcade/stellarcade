"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Gamepad2,
  Coins,
  Dices,
  Trophy,
  Flame,
  ShieldCheck,
  Award,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Zap,
  CheckCircle2,
  Lock,
  ExternalLink,
  History,
} from "lucide-react";
import { Button } from "./ui/button";
import { useWalletStatus } from "../hooks/useWalletStatus";
import { DataTable, type DataTableColumn } from "./DataTable";
import { motion } from "framer-motion";

interface ArenaTable {
  id: string;
  game: string;
  type: string;
  wager: string;
  multiplier: string;
  status: "active" | "open" | "filling";
  players: string;
}

const ARENA_TABLES: ArenaTable[] = [
  {
    id: "table-1",
    game: "Coinflip Duel",
    type: "1v1 PvP",
    wager: "5 XLM",
    multiplier: "2.0x",
    status: "active",
    players: "2/2",
  },
  {
    id: "table-2",
    game: "Verifiable Dice Roll",
    type: "Multiplier",
    wager: "10 XLM",
    multiplier: "1.98x - 98x",
    status: "open",
    players: "1/1",
  },
  {
    id: "table-3",
    game: "Prize Pool Gauntlet",
    type: "Tournament Pot",
    wager: "25 XLM",
    multiplier: "10.0x Pot",
    status: "filling",
    players: "8/16",
  },
];

interface ActivityItem {
  id: string;
  player: string;
  game: string;
  outcome: "win" | "loss";
  amount: string;
  time: string;
  proofHash: string;
}

const RECENT_ACTIVITY: ActivityItem[] = [
  {
    id: "act-1",
    player: "NeonViper",
    game: "Coinflip Duel",
    outcome: "win",
    amount: "+10.00 XLM",
    time: "2m ago",
    proofHash: "e3b0c44298fc1c149afbf4c8996fb924",
  },
  {
    id: "act-2",
    player: "SorobanWhale",
    game: "Dice Roll",
    outcome: "win",
    amount: "+49.50 XLM",
    time: "5m ago",
    proofHash: "8f434346648f6b96df89dda901c5176b",
  },
  {
    id: "act-3",
    player: "QuantumFlip",
    game: "Coinflip Duel",
    outcome: "loss",
    amount: "-5.00 XLM",
    time: "8m ago",
    proofHash: "ca978112ca1bbdcafac231b39a23dc4d",
  },
  {
    id: "act-4",
    player: "StellarGhost",
    game: "Prize Pool Gauntlet",
    outcome: "win",
    amount: "+120.00 XLM",
    time: "14m ago",
    proofHash: "5e884898da28047151d0e56f8dc62927",
  },
];

export function GameLobby() {
  const wallet = useWalletStatus();
  const [selectedCoinSide, setSelectedCoinSide] = useState<"heads" | "tails">("heads");
  const [coinWager, setCoinWager] = useState("5");
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipResult, setFlipResult] = useState<{ won: boolean; side: string } | null>(null);

  const handleSimulateFlip = () => {
    setIsFlipping(true);
    setFlipResult(null);
    setTimeout(() => {
      const outcome = Math.random() > 0.5 ? "heads" : "tails";
      const won = outcome === selectedCoinSide;
      setIsFlipping(false);
      setFlipResult({ won, side: outcome });
    }, 1200);
  };

  const tableColumns: DataTableColumn<ArenaTable>[] = [
    {
      key: "game",
      header: "Game Arena",
      render: (row) => (
        <div>
          <strong style={{ color: "#fff", display: "block" }}>{row.game}</strong>
          <span style={{ fontSize: "11px", color: "var(--sc-text-dim, #94a3b8)" }}>{row.type}</span>
        </div>
      ),
    },
    {
      key: "wager",
      header: "Wager",
      render: (row) => <span style={{ fontWeight: 700, color: "#fff" }}>{row.wager}</span>,
    },
    {
      key: "multiplier",
      header: "Multiplier",
      render: (row) => (
        <span style={{ fontWeight: 700, color: "var(--sc-accent, #00ffcc)" }}>{row.multiplier}</span>
      ),
    },
    {
      key: "players",
      header: "Capacity",
      render: (row) => <span style={{ color: "var(--sc-text-dim, #94a3b8)" }}>{row.players}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: "999px",
            background:
              row.status === "active"
                ? "rgba(0, 255, 204, 0.15)"
                : row.status === "filling"
                ? "rgba(59, 130, 246, 0.15)"
                : "rgba(255, 255, 255, 0.08)",
            color:
              row.status === "active"
                ? "var(--sc-accent, #00ffcc)"
                : row.status === "filling"
                ? "#60a5fa"
                : "#94a3b8",
            textTransform: "uppercase",
          }}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (row) => (
        <Button asChild variant="brand" size="sm">
          <Link href="/games">Play Table</Link>
        </Button>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* 1. HERO ARENA BANNER */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(0, 255, 204, 0.08) 0%, rgba(59, 130, 246, 0.04) 100%)",
          borderRadius: "20px",
          border: "1px solid var(--sc-border-glass, rgba(255, 255, 255, 0.1))",
          padding: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1.5rem",
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ maxWidth: "600px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.5rem" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 10px",
                borderRadius: "999px",
                background: "rgba(0, 255, 204, 0.15)",
                color: "var(--sc-accent, #00ffcc)",
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              <Zap size={13} /> Live On-Chain Arena
            </span>
          </div>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 0.5rem 0" }}>
            StellarCade Arcade Arena
          </h1>
          <p style={{ color: "var(--sc-text-dim, #94a3b8)", fontSize: "1rem", margin: 0 }}>
            Decentralized, provably fair on-chain multiplayer gaming powered by Stellar & Soroban smart contracts.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Button asChild variant="outline" size="sm">
            <Link href="/verify">
              <ShieldCheck size={14} style={{ marginRight: "6px" }} /> Verify Fairness
            </Link>
          </Button>
          <Button asChild variant="brand" size="sm">
            <Link href="/tournaments">
              <Trophy size={14} style={{ marginRight: "6px" }} /> View Tournaments
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. LIVE METRICS STRIP */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
        }}
      >
        <div
          style={{
            padding: "1.25rem",
            borderRadius: "14px",
            background: "var(--sc-bg-card, rgba(255, 255, 255, 0.03))",
            border: "1px solid var(--sc-border-glass, rgba(255, 255, 255, 0.08))",
          }}
        >
          <span style={{ fontSize: "11px", color: "var(--sc-text-dim, #94a3b8)", textTransform: "uppercase", display: "block" }}>
            Live Arena Tables
          </span>
          <strong style={{ fontSize: "1.5rem", color: "#fff", display: "block", margin: "2px 0" }}>3 Active Modes</strong>
          <span style={{ fontSize: "12px", color: "var(--sc-accent, #00ffcc)" }}>● Instant Matchmaking</span>
        </div>

        <div
          style={{
            padding: "1.25rem",
            borderRadius: "14px",
            background: "var(--sc-bg-card, rgba(255, 255, 255, 0.03))",
            border: "1px solid var(--sc-border-glass, rgba(255, 255, 255, 0.08))",
          }}
        >
          <span style={{ fontSize: "11px", color: "var(--sc-text-dim, #94a3b8)", textTransform: "uppercase", display: "block" }}>
            Autonomous Vault Pot
          </span>
          <strong style={{ fontSize: "1.5rem", color: "var(--sc-accent, #00ffcc)", display: "block", margin: "2px 0" }}>12,450 XLM</strong>
          <span style={{ fontSize: "12px", color: "var(--sc-text-dim, #94a3b8)" }}>2% Auto-Fee Accumulator</span>
        </div>

        <div
          style={{
            padding: "1.25rem",
            borderRadius: "14px",
            background: "var(--sc-bg-card, rgba(255, 255, 255, 0.03))",
            border: "1px solid var(--sc-border-glass, rgba(255, 255, 255, 0.08))",
          }}
        >
          <span style={{ fontSize: "11px", color: "var(--sc-text-dim, #94a3b8)", textTransform: "uppercase", display: "block" }}>
            Fairness Guarantee
          </span>
          <strong style={{ fontSize: "1.5rem", color: "#fff", display: "block", margin: "2px 0" }}>100% Provable</strong>
          <span style={{ fontSize: "12px", color: "var(--sc-text-dim, #94a3b8)" }}>SHA-256 WebCrypto Commit</span>
        </div>

        <div
          style={{
            padding: "1.25rem",
            borderRadius: "14px",
            background: "var(--sc-bg-card, rgba(255, 255, 255, 0.03))",
            border: "1px solid var(--sc-border-glass, rgba(255, 255, 255, 0.08))",
          }}
        >
          <span style={{ fontSize: "11px", color: "var(--sc-text-dim, #94a3b8)", textTransform: "uppercase", display: "block" }}>
            Network Status
          </span>
          <strong style={{ fontSize: "1.5rem", color: "#fff", display: "block", margin: "2px 0" }}>
            {wallet.network || "Stellar Testnet"}
          </strong>
          <span style={{ fontSize: "12px", color: wallet.capabilities.isConnected ? "var(--sc-accent, #00ffcc)" : "#94a3b8" }}>
            {wallet.capabilities.isConnected ? "● Wallet Connected" : "○ Guest Mode"}
          </span>
        </div>
      </div>

      {/* 3. FEATURED GAMES ARENA (3 CYBER CARDS) */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0 }}>Featured Game Arenas</h2>
            <p style={{ color: "var(--sc-text-dim, #94a3b8)", fontSize: "13px", margin: 0 }}>
              Select a game mode, place your wager in XLM, and execute on-chain provably fair rounds.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/games">
              View All Games <ArrowRight size={14} style={{ marginLeft: "4px" }} />
            </Link>
          </Button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {/* Card 1: Coinflip Duel */}
          <div
            style={{
              background: "var(--sc-bg-card, rgba(255, 255, 255, 0.04))",
              borderRadius: "16px",
              border: "1px solid var(--sc-border-glass, rgba(255, 255, 255, 0.1))",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "1.25rem",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Coins size={22} style={{ color: "var(--sc-accent, #00ffcc)" }} />
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>Coinflip Duel</h3>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "rgba(0, 255, 204, 0.15)", color: "var(--sc-accent, #00ffcc)" }}>
                  2.0X MULTIPLIER
                </span>
              </div>
              <p style={{ color: "var(--sc-text-dim, #94a3b8)", fontSize: "13px", margin: "0 0 1rem 0" }}>
                Instant 50/50 PvP or PvHouse coin flip. Pick Heads or Tails and double your XLM.
              </p>

              {/* Side Selection */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                <button
                  type="button"
                  onClick={() => setSelectedCoinSide("heads")}
                  style={{
                    padding: "8px",
                    borderRadius: "8px",
                    border: selectedCoinSide === "heads" ? "1px solid #00ffcc" : "1px solid rgba(255,255,255,0.1)",
                    background: selectedCoinSide === "heads" ? "rgba(0,255,204,0.15)" : "transparent",
                    color: selectedCoinSide === "heads" ? "#00ffcc" : "#fff",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  HEADS
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCoinSide("tails")}
                  style={{
                    padding: "8px",
                    borderRadius: "8px",
                    border: selectedCoinSide === "tails" ? "1px solid #00ffcc" : "1px solid rgba(255,255,255,0.1)",
                    background: selectedCoinSide === "tails" ? "rgba(0,255,204,0.15)" : "transparent",
                    color: selectedCoinSide === "tails" ? "#00ffcc" : "#fff",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  TAILS
                </button>
              </div>

              {/* Result Preview */}
              {flipResult && (
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: flipResult.won ? "rgba(0, 255, 204, 0.15)" : "rgba(239, 68, 68, 0.15)",
                    border: `1px solid ${flipResult.won ? "#00ffcc" : "#ef4444"}`,
                    color: flipResult.won ? "#00ffcc" : "#ef4444",
                    fontSize: "13px",
                    fontWeight: 700,
                    textAlign: "center",
                    marginBottom: "10px",
                  }}
                >
                  {flipResult.won ? `🎉 WON! Landed on ${flipResult.side.toUpperCase()}` : `Landed on ${flipResult.side.toUpperCase()} (Try again!)`}
                </div>
              )}
            </div>

            <Button
              type="button"
              onClick={handleSimulateFlip}
              disabled={isFlipping}
              variant="brand"
              size="sm"
              className="w-full"
            >
              {isFlipping ? "Flipping on Soroban..." : "Flip 5 XLM (Instant Play)"}
            </Button>
          </div>

          {/* Card 2: Verifiable Dice */}
          <div
            style={{
              background: "var(--sc-bg-card, rgba(255, 255, 255, 0.04))",
              borderRadius: "16px",
              border: "1px solid var(--sc-border-glass, rgba(255, 255, 255, 0.1))",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "1.25rem",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Dices size={22} style={{ color: "#60a5fa" }} />
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>Verifiable Dice</h3>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}>
                  UP TO 98X
                </span>
              </div>
              <p style={{ color: "var(--sc-text-dim, #94a3b8)", fontSize: "13px", margin: "0 0 1rem 0" }}>
                Cryptographic roll over/under. Set your win probability and multiplier curve.
              </p>

              <div
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  marginBottom: "10px",
                }}
              >
                <span style={{ color: "var(--sc-text-dim, #94a3b8)" }}>Target: Roll &gt; 50</span>
                <strong style={{ color: "#60a5fa" }}>1.98x Payout</strong>
              </div>
            </div>

            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/games">Launch Dice Arena</Link>
            </Button>
          </div>

          {/* Card 3: Prize Pool Gauntlet */}
          <div
            style={{
              background: "var(--sc-bg-card, rgba(255, 255, 255, 0.04))",
              borderRadius: "16px",
              border: "1px solid var(--sc-border-glass, rgba(255, 255, 255, 0.1))",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "1.25rem",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Trophy size={22} style={{ color: "#fbbf24" }} />
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>Gauntlet Pot</h3>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "rgba(251, 191, 36, 0.15)", color: "#fbbf24" }}>
                  TOURNAMENT
                </span>
              </div>
              <p style={{ color: "var(--sc-text-dim, #94a3b8)", fontSize: "13px", margin: "0 0 1rem 0" }}>
                Survivor bracket arena where entry fees compound into a winner-takes-all smart contract vault.
              </p>

              <div
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  marginBottom: "10px",
                }}
              >
                <span style={{ color: "var(--sc-text-dim, #94a3b8)" }}>Active Pot: 1,500 XLM</span>
                <strong style={{ color: "#fbbf24" }}>8/16 Joined</strong>
              </div>
            </div>

            <Button asChild variant="brand" size="sm" className="w-full">
              <Link href="/tournaments">Enter Gauntlet</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 4. LIVE ARENA TABLES & AUDIT STREAM */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.5rem" }}>
        {/* Left Column: Live Arena Tables */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>Active Arena Tables</h3>
            <span style={{ fontSize: "12px", color: "var(--sc-accent, #00ffcc)" }}>● 3 Tables Running</span>
          </div>
          <DataTable columns={tableColumns} data={ARENA_TABLES} pageSize={5} />
        </div>

        {/* Right Column: Real-Time Provable Activity */}
        <div
          style={{
            background: "var(--sc-bg-card, rgba(255, 255, 255, 0.03))",
            borderRadius: "16px",
            border: "1px solid var(--sc-border-glass, rgba(255, 255, 255, 0.08))",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <History size={18} style={{ color: "var(--sc-accent, #00ffcc)" }} />
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Live Settlement Feed</h3>
              </div>
              <span style={{ fontSize: "11px", color: "var(--sc-text-dim, #94a3b8)" }}>Stellar ledger updates</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {RECENT_ACTIVITY.map((act) => (
                <div
                  key={act.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "13px", color: "#fff", display: "block" }}>{act.player}</strong>
                    <span style={{ fontSize: "11px", color: "var(--sc-text-dim, #94a3b8)" }}>
                      {act.game} • {act.time}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 800,
                        color: act.outcome === "win" ? "var(--sc-accent, #00ffcc)" : "#ef4444",
                      }}
                    >
                      {act.amount}
                    </span>
                    <Link
                      href={`/verify?hash=${act.proofHash}`}
                      style={{
                        fontSize: "10px",
                        color: "var(--sc-accent, #00ffcc)",
                        textDecoration: "none",
                        fontWeight: 600,
                      }}
                    >
                      Verify Proof ↗
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: "1rem" }}>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/history">View Complete Match History</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameLobby;
