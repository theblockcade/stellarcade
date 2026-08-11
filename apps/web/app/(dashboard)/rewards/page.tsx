"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Coins,
  Trophy,
  Award,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Button } from "../../../src/components/ui/button";
import { useWalletStatus } from "../../../src/hooks/useWalletStatus";
import { motion } from "framer-motion";

interface RewardItem {
  id: string;
  title: string;
  source: string;
  amountXlm: number;
  status: "claimable" | "claimed" | "locked";
  expiry: string;
}

const REWARDS: RewardItem[] = [
  {
    id: "rew-1",
    title: "Weekly Tournament Top 10 Split",
    source: "Weekly Soroban Gauntlet",
    amountXlm: 125,
    status: "claimable",
    expiry: "6 days remaining",
  },
  {
    id: "rew-2",
    title: "Quest Milestone: Provable Fairness Auditor",
    source: "Daily Quests",
    amountXlm: 15,
    status: "claimable",
    expiry: "23 hours remaining",
  },
  {
    id: "rew-3",
    title: "Community Vault Season 1 Jackpot",
    source: "Prize Pool Vault",
    amountXlm: 250,
    status: "locked",
    expiry: "Draw in 2 days",
  },
];

export default function RewardsPage() {
  const wallet = useWalletStatus();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimedIds, setClaimedIds] = useState<string[]>([]);

  const handleClaim = async (reward: RewardItem) => {
    if (!wallet.capabilities.isConnected) {
      await wallet.connect();
      return;
    }

    setClaimingId(reward.id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setClaimedIds((prev) => [...prev, reward.id]);
    } finally {
      setClaimingId(null);
    }
  };

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
            <Coins size={30} style={{ color: "var(--sc-accent, #00ffcc)" }} />
            <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>Claimable Rewards & Vaults</h1>
          </div>
          <p style={{ color: "var(--sc-text-dim, #94a3b8)", margin: 0, fontSize: "1rem" }}>
            Withdraw your tournament prizes, quest payouts, and accumulated jackpot shares directly to your connected wallet.
          </p>
        </div>

        <Button asChild variant="outline" size="sm">
          <Link href="/portfolio">View Portfolio</Link>
        </Button>
      </div>

      {/* Rewards Grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {REWARDS.map((rew, idx) => {
          const isClaimed = claimedIds.includes(rew.id);
          const isProcessing = claimingId === rew.id;

          return (
            <motion.div
              key={rew.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
              style={{
                background: "var(--sc-bg-card, rgba(255,255,255,0.04))",
                borderRadius: "16px",
                border: rew.status === "claimable" && !isClaimed
                  ? "1px solid var(--sc-accent, #00ffcc)"
                  : "1px solid var(--sc-border-glass, rgba(255,255,255,0.08))",
                padding: "1.5rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1.5rem",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "4px",
                      background: rew.status === "claimable" ? "rgba(0, 255, 204, 0.15)" : "rgba(255, 255, 255, 0.08)",
                      color: rew.status === "claimable" ? "var(--sc-accent, #00ffcc)" : "#cbd5e1",
                      textTransform: "uppercase",
                    }}
                  >
                    {rew.source}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--sc-text-dim, #94a3b8)" }}>
                    {rew.expiry}
                  </span>
                </div>

                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 4px 0" }}>{rew.title}</h3>
                <span style={{ fontSize: "1.25rem", color: "var(--sc-accent, #00ffcc)", fontWeight: 800 }}>
                  {rew.amountXlm} XLM
                </span>
              </div>

              <div>
                {isClaimed ? (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "14px",
                      color: "var(--sc-accent, #00ffcc)",
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle2 size={18} /> Payout Disbursed
                  </span>
                ) : rew.status === "claimable" ? (
                  <button
                    type="button"
                    onClick={() => handleClaim(rew)}
                    disabled={isProcessing}
                    style={{
                      padding: "10px 22px",
                      borderRadius: "8px",
                      background: "var(--sc-accent, #00ffcc)",
                      color: "#000",
                      fontWeight: 700,
                      fontSize: "14px",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {isProcessing ? "Signing on Soroban..." : "Claim Payout"}
                  </button>
                ) : (
                  <span style={{ fontSize: "13px", color: "var(--sc-text-dim, #94a3b8)", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Lock size={14} /> Locked until Epoch Close
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
