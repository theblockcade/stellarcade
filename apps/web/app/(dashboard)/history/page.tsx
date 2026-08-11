"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  History,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Coins,
  Dices,
  Trophy,
} from "lucide-react";
import { Button } from "../../../src/components/ui/button";
import { useWalletStatus } from "../../../src/hooks/useWalletStatus";
import { motion } from "framer-motion";

interface MatchRecord {
  id: string;
  game: string;
  gameType: "coinflip" | "dice" | "gauntlet";
  wagerXlm: number;
  outcome: "WIN" | "LOSS";
  payoutXlm: number;
  serverSeed: string;
  commitHash: string;
  clientSeed: string;
  nonce: number;
  rangeSize: number;
  timestamp: string;
}

const RECENT_MATCHES: MatchRecord[] = [
  {
    id: "cf-104859",
    game: "Coinflip Duel",
    gameType: "coinflip",
    wagerXlm: 25,
    outcome: "WIN",
    payoutXlm: 49,
    serverSeed: "d4e5f601728394a5b6c7d8e9f0123456789abcdef0123456789abcdef0123456",
    commitHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    clientSeed: "GBZXN7PIRZGNMHGA72STUFIO-4921",
    nonce: 1,
    rangeSize: 2,
    timestamp: "10 mins ago",
  },
  {
    id: "dice-49281",
    game: "Verifiable Dice Roll",
    gameType: "dice",
    wagerXlm: 10,
    outcome: "LOSS",
    payoutXlm: 0,
    serverSeed: "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0",
    commitHash: "c8996fb92427ae41e4649b934ca495991b7852b855e3b0c44298fc1c149afbf4",
    clientSeed: "DICE-PLAYER-ENTROPY-88",
    nonce: 2,
    rangeSize: 6,
    timestamp: "25 mins ago",
  },
  {
    id: "cf-104842",
    game: "Coinflip Duel",
    gameType: "coinflip",
    wagerXlm: 50,
    outcome: "WIN",
    payoutXlm: 98,
    serverSeed: "9876543210fedcba0123456789abcdef0123456789abcdef0123456789abcdef",
    commitHash: "4ca495991b7852b855e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b93",
    clientSeed: "GBZXN7PIRZGNMHGA72STUFIO-4921",
    nonce: 3,
    rangeSize: 2,
    timestamp: "1 hour ago",
  },
];

export default function HistoryPage() {
  const wallet = useWalletStatus();

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
            <History size={30} style={{ color: "var(--sc-accent, #00ffcc)" }} />
            <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>Match History & Proofs</h1>
          </div>
          <p style={{ color: "var(--sc-text-dim, #94a3b8)", margin: 0, fontSize: "1rem" }}>
            Review your on-chain gameplay history and independently verify the SHA-256 commit-reveal proof for any settled round.
          </p>
        </div>

        <Button asChild variant="brand" size="sm">
          <Link href="/verify">
            <ShieldCheck size={16} style={{ marginRight: "6px" }} /> Open Fairness Verifier
          </Link>
        </Button>
      </div>

      {/* History Table */}
      <div
        style={{
          background: "var(--sc-bg-card, rgba(255,255,255,0.04))",
          borderRadius: "16px",
          border: "1px solid var(--sc-border-glass, rgba(255,255,255,0.1))",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)", color: "var(--sc-text-dim, #94a3b8)" }}>
                <th style={{ padding: "14px 16px" }}>Game</th>
                <th style={{ padding: "14px 16px" }}>Wager</th>
                <th style={{ padding: "14px 16px" }}>Result</th>
                <th style={{ padding: "14px 16px" }}>Payout</th>
                <th style={{ padding: "14px 16px" }}>Settled</th>
                <th style={{ padding: "14px 16px", textAlign: "right" }}>Cryptographic Audit</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_MATCHES.map((m) => (
                <tr key={m.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "14px 16px" }}>
                    <strong style={{ display: "block", color: "#fff" }}>{m.game}</strong>
                    <span style={{ fontSize: "11px", color: "var(--sc-text-dim, #94a3b8)", fontFamily: "monospace" }}>
                      ID: {m.id}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", fontWeight: 600 }}>{m.wagerXlm} XLM</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: 700,
                        background: m.outcome === "WIN" ? "rgba(0, 255, 204, 0.15)" : "rgba(239, 68, 68, 0.15)",
                        color: m.outcome === "WIN" ? "var(--sc-accent, #00ffcc)" : "#f87171",
                      }}
                    >
                      {m.outcome}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: m.outcome === "WIN" ? "var(--sc-accent, #00ffcc)" : "#fff" }}>
                    {m.payoutXlm > 0 ? `+${m.payoutXlm} XLM` : "0 XLM"}
                  </td>
                  <td style={{ padding: "14px 16px", color: "var(--sc-text-dim, #94a3b8)" }}>{m.timestamp}</td>
                  <td style={{ padding: "14px 16px", textAlign: "right" }}>
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={`/verify?serverSeed=${m.serverSeed}&commitHash=${m.commitHash}&clientSeed=${m.clientSeed}&nonce=${m.nonce}&rangeSize=${m.rangeSize}`}
                      >
                        <ShieldCheck size={14} style={{ marginRight: "4px", color: "var(--sc-accent, #00ffcc)" }} />
                        Verify Proof
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
