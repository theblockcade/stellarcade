"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Calendar,
  Users,
  ShieldCheck,
  Zap,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "../../../src/components/ui/button";
import { useWalletStatus } from "../../../src/hooks/useWalletStatus";
import { motion } from "framer-motion";

interface Tournament {
  id: string;
  title: string;
  category: string;
  entryFeeXlm: number;
  prizePoolXlm: number;
  participants: number;
  maxParticipants: number;
  status: "live" | "registration" | "upcoming";
  startsIn: string;
}

const TOURNAMENTS: Tournament[] = [
  {
    id: "stc-weekly-championship",
    title: "Weekly Soroban High-Roller Gauntlet",
    category: "Swiss Bracket",
    entryFeeXlm: 50,
    prizePoolXlm: 3500,
    participants: 48,
    maxParticipants: 64,
    status: "registration",
    startsIn: "4 hours 15 mins",
  },
  {
    id: "stc-daily-duel-blitz",
    title: "Daily Coinflip Blitz Invitational",
    category: "Single Elimination",
    entryFeeXlm: 10,
    prizePoolXlm: 850,
    participants: 32,
    maxParticipants: 32,
    status: "live",
    startsIn: "Live Now",
  },
  {
    id: "stc-dice-masters-open",
    title: "Dice Masters Seasonal Open",
    category: "Points Tournament",
    entryFeeXlm: 25,
    prizePoolXlm: 2000,
    participants: 19,
    maxParticipants: 100,
    status: "upcoming",
    startsIn: "2 days",
  },
];

export default function TournamentsPage() {
  const wallet = useWalletStatus();
  const [registeredIds, setRegisteredIds] = useState<string[]>([]);
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  const handleRegister = async (t: Tournament) => {
    if (!wallet.capabilities.isConnected) {
      await wallet.connect();
      return;
    }

    setRegisteringId(t.id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setRegisteredIds((prev) => [...prev, t.id]);
    } finally {
      setRegisteringId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "1.75rem",
        width: "100%",
      }}
    >
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
            <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>Tournaments & Brackets</h1>
          </div>
          <p style={{ color: "var(--sc-text-dim, #94a3b8)", margin: 0, fontSize: "1rem" }}>
            Compete in scheduled on-chain brackets. Entry fees accumulate into smart contract escrow vaults with automated payout splits.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Button asChild variant="outline" size="sm">
            <Link href="/leaderboard">View Leaderboards</Link>
          </Button>
          <Button asChild variant="brand" size="sm">
            <Link href="/app">Lobby</Link>
          </Button>
        </div>
      </div>

      {/* Tournaments Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {TOURNAMENTS.map((t, idx) => {
          const isRegistered = registeredIds.includes(t.id);
          const isProcessing = registeringId === t.id;

          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              style={{
                background: "var(--sc-bg-card, rgba(255,255,255,0.04))",
                borderRadius: "16px",
                border: "1px solid var(--sc-border-glass, rgba(255,255,255,0.1))",
                padding: "1.75rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "1.5rem",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "4px",
                      background: t.status === "live" ? "rgba(239, 68, 68, 0.2)" : "rgba(0, 255, 204, 0.15)",
                      color: t.status === "live" ? "#f87171" : "var(--sc-accent, #00ffcc)",
                      textTransform: "uppercase",
                    }}
                  >
                    {t.status === "live" ? "🔴 Live Match" : t.status}
                  </span>

                  <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8125rem", color: "var(--sc-text-dim, #94a3b8)" }}>
                    <Clock size={13} /> {t.startsIn}
                  </span>
                </div>

                <h3 style={{ fontSize: "1.3rem", fontWeight: 700, margin: "0 0 0.5rem 0" }}>{t.title}</h3>
                <span style={{ fontSize: "0.85rem", color: "var(--sc-text-dim, #94a3b8)", display: "block", marginBottom: "1rem" }}>
                  {t.category}
                </span>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    padding: "12px",
                    borderRadius: "10px",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--sc-text-dim, #94a3b8)", display: "block" }}>Prize Pool</span>
                    <strong style={{ fontSize: "1.1rem", color: "var(--sc-accent, #00ffcc)" }}>{t.prizePoolXlm} XLM</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--sc-text-dim, #94a3b8)", display: "block" }}>Entry Fee</span>
                    <strong style={{ fontSize: "1.1rem", color: "#fff" }}>{t.entryFeeXlm} XLM</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--sc-text-dim, #94a3b8)" }}>
                  <span>Registered Players</span>
                  <span>{t.participants} / {t.maxParticipants}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRegister(t)}
                  disabled={isRegistered || isProcessing || t.status === "live"}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    background: isRegistered ? "rgba(0, 255, 204, 0.2)" : "var(--sc-accent, #00ffcc)",
                    color: isRegistered ? "var(--sc-accent, #00ffcc)" : "#000",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    border: isRegistered ? "1px solid var(--sc-accent, #00ffcc)" : "none",
                    cursor: isRegistered || t.status === "live" ? "default" : "pointer",
                  }}
                >
                  {isRegistered
                    ? "✓ Registered"
                    : isProcessing
                    ? "Submitting Entry..."
                    : t.status === "live"
                    ? "Bracket In Progress"
                    : !wallet.capabilities.isConnected
                    ? "Connect Wallet to Enter"
                    : `Enter Tournament (${t.entryFeeXlm} XLM)`}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
