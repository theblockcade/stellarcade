"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Award,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Flame,
} from "lucide-react";
import { Button } from "../../../src/components/ui/button";
import { useWalletStatus } from "../../../src/hooks/useWalletStatus";
import { motion } from "framer-motion";

interface Quest {
  id: string;
  title: string;
  category: "Daily" | "Weekly" | "Special";
  xpReward: number;
  progress: number;
  total: number;
  completed: boolean;
  claimed: boolean;
  desc: string;
}

const INITIAL_QUESTS: Quest[] = [
  {
    id: "quest-1",
    title: "Provable Fairness Auditor",
    category: "Daily",
    xpReward: 150,
    progress: 1,
    total: 1,
    completed: true,
    claimed: false,
    desc: "Verify any game round's cryptographic SHA-256 seed proof on the /verify page.",
  },
  {
    id: "quest-2",
    title: "Arcade Gladiator",
    category: "Daily",
    xpReward: 250,
    progress: 2,
    total: 3,
    completed: false,
    claimed: false,
    desc: "Complete 3 on-chain duels (Coinflip or Dice) on the Stellar Testnet.",
  },
  {
    id: "quest-3",
    title: "Account Hygiene Master",
    category: "Weekly",
    xpReward: 500,
    progress: 0,
    total: 1,
    completed: false,
    claimed: false,
    desc: "Scan your wallet on /cleanup and review inactive subentry reserves.",
  },
  {
    id: "quest-4",
    title: "Gauntlet Champion",
    category: "Special",
    xpReward: 1000,
    progress: 0,
    total: 5,
    completed: false,
    claimed: false,
    desc: "Win 5 consecutive multiplier rounds in the Prize Pool Gauntlet.",
  },
];

export default function QuestsPage() {
  const wallet = useWalletStatus();
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleClaim = async (questId: string) => {
    setClaimingId(questId);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setQuests((prev) =>
        prev.map((q) => (q.id === questId ? { ...q, claimed: true } : q))
      );
    } finally {
      setClaimingId(null);
    }
  };

  const totalEarnedXp = quests
    .filter((q) => q.claimed)
    .reduce((sum, q) => sum + q.xpReward, 450);

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
            <Award size={30} style={{ color: "var(--sc-accent, #00ffcc)" }} />
            <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>Quests & Soulbound Badges</h1>
          </div>
          <p style={{ color: "var(--sc-text-dim, #94a3b8)", margin: 0, fontSize: "1rem" }}>
            Complete gameplay milestones, accumulate XP, and mint non-transferable Soulbound NFT certificates (SBTs) on Soroban.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 18px",
            borderRadius: "12px",
            background: "rgba(0, 255, 204, 0.1)",
            border: "1px solid rgba(0, 255, 204, 0.25)",
          }}
        >
          <Sparkles size={20} style={{ color: "var(--sc-accent, #00ffcc)" }} />
          <div>
            <span style={{ fontSize: "11px", color: "var(--sc-text-dim, #94a3b8)", textTransform: "uppercase", display: "block" }}>
              Total Player XP
            </span>
            <strong style={{ fontSize: "1.2rem", color: "#fff" }}>{totalEarnedXp} XP</strong>
          </div>
        </div>
      </div>

      {/* Quests List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {quests.map((q, idx) => {
          const pct = Math.min(100, Math.round((q.progress / q.total) * 100));
          const isProcessing = claimingId === q.id;

          return (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.06 }}
              style={{
                background: "var(--sc-bg-card, rgba(255,255,255,0.04))",
                borderRadius: "14px",
                border: q.completed && !q.claimed
                  ? "1px solid rgba(0, 255, 204, 0.4)"
                  : "1px solid var(--sc-border-glass, rgba(255,255,255,0.08))",
                padding: "1.25rem 1.5rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1.25rem",
              }}
            >
              <div style={{ flex: "1 1 320px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "4px",
                      background: "rgba(255, 255, 255, 0.08)",
                      color: "#cbd5e1",
                      textTransform: "uppercase",
                    }}
                  >
                    {q.category}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--sc-accent, #00ffcc)", fontWeight: 700 }}>
                    +{q.xpReward} XP
                  </span>
                </div>

                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 4px 0" }}>{q.title}</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--sc-text-dim, #94a3b8)", margin: "0 0 10px 0" }}>
                  {q.desc}
                </p>

                {/* Progress bar */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      flex: 1,
                      maxWidth: "200px",
                      height: "6px",
                      borderRadius: "999px",
                      background: "rgba(255,255,255,0.1)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: "var(--sc-accent, #00ffcc)",
                        borderRadius: "999px",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "12px", color: "var(--sc-text-dim, #94a3b8)" }}>
                    {q.progress} / {q.total}
                  </span>
                </div>
              </div>

              <div>
                {q.claimed ? (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "13px",
                      color: "var(--sc-accent, #00ffcc)",
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle2 size={16} /> Claimed
                  </span>
                ) : q.completed ? (
                  <button
                    type="button"
                    onClick={() => handleClaim(q.id)}
                    disabled={isProcessing}
                    style={{
                      padding: "8px 18px",
                      borderRadius: "8px",
                      background: "var(--sc-accent, #00ffcc)",
                      color: "#000",
                      fontWeight: 700,
                      fontSize: "13px",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {isProcessing ? "Minting..." : "Claim XP Reward"}
                  </button>
                ) : (
                  <Button asChild variant="outline" size="sm">
                    <Link href="/games">
                      Play Now <ArrowRight size={13} style={{ marginLeft: "4px" }} />
                    </Link>
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
