"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Medal,
  Flame,
  Award,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Filter,
} from "lucide-react";
import { Button } from "../../../src/components/ui/button";
import { useWalletStatus } from "../../../src/hooks/useWalletStatus";
import { motion } from "framer-motion";

interface LeaderboardEntry {
  rank: number;
  address: string;
  username: string;
  wins: number;
  totalVolumeXlm: number;
  winRate: string;
  badge: string;
  isCurrentUser?: boolean;
}

const LEADERBOARD_DATA: LeaderboardEntry[] = [
  {
    rank: 1,
    address: "GBZXN7PIRZGNMHGA72STUFIO",
    username: "NeonViper",
    wins: 142,
    totalVolumeXlm: 3450,
    winRate: "68.4%",
    badge: "👑 Grandmaster",
  },
  {
    rank: 2,
    address: "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVTHZ",
    username: "SorobanWhale",
    wins: 119,
    totalVolumeXlm: 2890,
    winRate: "64.1%",
    badge: "💎 Diamond Duelist",
  },
  {
    rank: 3,
    address: "GBBD47IF6LWK7P7MDEVSCADEPLAYERHYGIENE777SAMPLE",
    username: "QuantumFlip",
    wins: 97,
    totalVolumeXlm: 2150,
    winRate: "61.8%",
    badge: "⚔️ Master Duelist",
  },
  {
    rank: 4,
    address: "GCH4X78923KLMNO982347892348923489234892348923489234",
    username: "StellarGhost",
    wins: 76,
    totalVolumeXlm: 1640,
    winRate: "59.2%",
    badge: "🌟 Platinum Player",
  },
  {
    rank: 5,
    address: "GDF834928347923489234892348923489234892348923489234",
    username: "CipherRoll",
    wins: 62,
    totalVolumeXlm: 1220,
    winRate: "57.5%",
    badge: "🥇 Gold Rank",
  },
];

export default function LeaderboardPage() {
  const wallet = useWalletStatus();
  const [timeframe, setTimeframe] = useState<"weekly" | "all_time">("weekly");

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.5rem" }}>
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
            <Trophy size={30} style={{ color: "var(--sc-accent, #00ffcc)" }} />
            <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>Arcade Leaderboard</h1>
          </div>
          <p style={{ color: "var(--sc-text-dim, #94a3b8)", margin: 0, fontSize: "1rem" }}>
            Track top-performing players across Coinflip Duels, Dice Rolls, and Tournament Brackets on Stellar.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={() => setTimeframe("weekly")}
            style={{
              padding: "6px 16px",
              borderRadius: "8px",
              border: timeframe === "weekly" ? "1px solid #00ffcc" : "1px solid rgba(255,255,255,0.1)",
              background: timeframe === "weekly" ? "rgba(0, 255, 204, 0.15)" : "transparent",
              color: timeframe === "weekly" ? "#00ffcc" : "#fff",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Weekly Epoch
          </button>
          <button
            type="button"
            onClick={() => setTimeframe("all_time")}
            style={{
              padding: "6px 16px",
              borderRadius: "8px",
              border: timeframe === "all_time" ? "1px solid #00ffcc" : "1px solid rgba(255,255,255,0.1)",
              background: timeframe === "all_time" ? "rgba(0, 255, 204, 0.15)" : "transparent",
              color: timeframe === "all_time" ? "#00ffcc" : "#fff",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            All-Time
          </button>
        </div>
      </div>

      {/* Top 3 Spotlight Podium */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2rem",
        }}
      >
        {LEADERBOARD_DATA.slice(0, 3).map((player, idx) => (
          <motion.div
            key={player.address}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            style={{
              background: idx === 0 ? "linear-gradient(135deg, rgba(0, 255, 204, 0.12), rgba(0,0,0,0.5))" : "var(--sc-bg-card, rgba(255,255,255,0.04))",
              borderRadius: "16px",
              border: idx === 0 ? "1px solid var(--sc-accent, #00ffcc)" : "1px solid var(--sc-border-glass, rgba(255,255,255,0.1))",
              padding: "1.5rem",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>
              {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--sc-accent, #00ffcc)", fontWeight: 700, textTransform: "uppercase" }}>
              {player.badge}
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0.25rem 0" }}>{player.username}</h3>
            <span style={{ fontSize: "12px", color: "var(--sc-text-dim, #94a3b8)", fontFamily: "monospace", display: "block", marginBottom: "1rem" }}>
              {player.address.slice(0, 6)}...{player.address.slice(-4)}
            </span>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "10px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "var(--sc-text-dim, #94a3b8)", display: "block" }}>Wins</span>
                <strong style={{ fontSize: "1rem", color: "#fff" }}>{player.wins}</strong>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "var(--sc-text-dim, #94a3b8)", display: "block" }}>Volume</span>
                <strong style={{ fontSize: "1rem", color: "var(--sc-accent, #00ffcc)" }}>{player.totalVolumeXlm} XLM</strong>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Full Leaderboard Table */}
      <div
        style={{
          background: "var(--sc-bg-card, rgba(255,255,255,0.04))",
          borderRadius: "16px",
          border: "1px solid var(--sc-border-glass, rgba(255,255,255,0.1))",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Top Ranked Players</h2>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)", color: "var(--sc-text-dim, #94a3b8)" }}>
                <th style={{ padding: "12px 16px" }}>Rank</th>
                <th style={{ padding: "12px 16px" }}>Player</th>
                <th style={{ padding: "12px 16px" }}>Wins</th>
                <th style={{ padding: "12px 16px" }}>Win Rate</th>
                <th style={{ padding: "12px 16px" }}>Volume</th>
              </tr>
            </thead>
            <tbody>
              {LEADERBOARD_DATA.map((player) => (
                <tr
                  key={player.address}
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: player.rank <= 3 ? "var(--sc-accent, #00ffcc)" : "#fff" }}>
                    #{player.rank}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <strong style={{ display: "block", color: "#fff" }}>{player.username}</strong>
                    <span style={{ fontSize: "11px", color: "var(--sc-text-dim, #94a3b8)", fontFamily: "monospace" }}>
                      {player.address.slice(0, 8)}...{player.address.slice(-4)}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", fontWeight: 600 }}>{player.wins}</td>
                  <td style={{ padding: "14px 16px", color: "var(--sc-accent, #00ffcc)", fontWeight: 600 }}>{player.winRate}</td>
                  <td style={{ padding: "14px 16px", fontWeight: 700 }}>{player.totalVolumeXlm} XLM</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
