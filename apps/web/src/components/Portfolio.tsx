"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Wallet,
  Coins,
  Award,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Trophy,
} from "lucide-react";
import { Button } from "./ui/button";
import { useWalletStatus } from "../hooks/useWalletStatus";
import { motion } from "framer-motion";
import GlobalStateStore from "../services/global-state-store";

export interface WalletPortfolioData {
  availableBalance: number;
  networkLabel: string;
}

export interface RewardPortfolioItem {
  id: string;
  title: string;
  amountLabel: string;
}

export interface CollectiblePortfolioItem {
  id: string;
  name: string;
  rarity: string;
}

export interface PortfolioSectionState<T> {
  status: "loading" | "error" | "ready";
  items: T[];
  errorMessage?: string;
}

export interface PortfolioState {
  wallet: PortfolioSectionState<WalletPortfolioData>;
  rewards: PortfolioSectionState<RewardPortfolioItem>;
  collectibles: PortfolioSectionState<CollectiblePortfolioItem>;
}

export interface PortfolioProps {
  state?: PortfolioState;
  activeCampaignsCount?: number;
  onOpenWallet?: () => void;
  onBrowseRewards?: () => void;
  onBrowseCollectibles?: () => void;
}

export const Portfolio: React.FC<PortfolioProps> = ({
  state,
  activeCampaignsCount,
  onOpenWallet,
  onBrowseRewards,
  onBrowseCollectibles,
}) => {
  const wallet = useWalletStatus();
  const [activeTab, setActiveTab] = useState<"balances" | "rewards" | "badges">("balances");

  const compactAddress = wallet.address
    ? `${wallet.address.slice(0, 8)}...${wallet.address.slice(-6)}`
    : "No wallet connected";

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
      data-testid="portfolio-view"
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
          borderBottom: "1px solid var(--sc-border-glass, rgba(255, 255, 255, 0.1))",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <Wallet size={30} style={{ color: "var(--sc-accent, #00ffcc)" }} />
            <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>Portfolio & Player Vault</h1>
          </div>
          <p style={{ color: "var(--sc-text-dim, #94a3b8)", margin: 0, fontSize: "1rem" }}>
            Monitor your available XLM, in-play game escrows, claimable prize distributions, and on-chain Soulbound Badges.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <Button asChild variant="outline" size="sm">
            <Link href="/cleanup">
              <ShieldCheck size={14} style={{ marginRight: "6px" }} /> Account Hygiene
            </Link>
          </Button>
          <Button asChild variant="brand" size="sm">
            <Link href="/rewards">
              <Coins size={14} style={{ marginRight: "6px" }} /> Claim Rewards
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "1.5rem" }}>
        <button
          type="button"
          onClick={() => setActiveTab("balances")}
          style={{
            padding: "8px 18px",
            borderRadius: "8px",
            border: activeTab === "balances" ? "1px solid #00ffcc" : "1px solid rgba(255,255,255,0.1)",
            background: activeTab === "balances" ? "rgba(0, 255, 204, 0.15)" : "transparent",
            color: activeTab === "balances" ? "#00ffcc" : "#fff",
            fontWeight: 700,
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Wallet Balances
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("rewards")}
          style={{
            padding: "8px 18px",
            borderRadius: "8px",
            border: activeTab === "rewards" ? "1px solid #00ffcc" : "1px solid rgba(255,255,255,0.1)",
            background: activeTab === "rewards" ? "rgba(0, 255, 204, 0.15)" : "transparent",
            color: activeTab === "rewards" ? "#00ffcc" : "#fff",
            fontWeight: 700,
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Prize Vaults & Rewards
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("badges")}
          style={{
            padding: "8px 18px",
            borderRadius: "8px",
            border: activeTab === "badges" ? "1px solid #00ffcc" : "1px solid rgba(255,255,255,0.1)",
            background: activeTab === "badges" ? "rgba(0, 255, 204, 0.15)" : "transparent",
            color: activeTab === "badges" ? "#00ffcc" : "#fff",
            fontWeight: 700,
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Soulbound Badges (SBTs)
        </button>
      </div>

      {/* Tab 1: Balances */}
      {activeTab === "balances" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "1.25rem",
            }}
          >
            <div
              style={{
                background: "var(--sc-bg-card, rgba(255, 255, 255, 0.04))",
                borderRadius: "16px",
                border: "1px solid var(--sc-border-glass, rgba(255, 255, 255, 0.1))",
                padding: "1.5rem",
              }}
            >
              <span style={{ fontSize: "12px", color: "var(--sc-text-dim, #94a3b8)", textTransform: "uppercase", display: "block" }}>
                Available Balance
              </span>
              <strong style={{ fontSize: "1.8rem", color: "var(--sc-accent, #00ffcc)", display: "block", margin: "4px 0" }}>
                {wallet.capabilities.isConnected ? "145.50 XLM" : "0.00 XLM"}
              </strong>
              <span style={{ fontSize: "12px", color: "var(--sc-text-dim, #94a3b8)" }}>
                {wallet.network || "Stellar Testnet"}
              </span>
            </div>

            <div
              style={{
                background: "var(--sc-bg-card, rgba(255, 255, 255, 0.04))",
                borderRadius: "16px",
                border: "1px solid var(--sc-border-glass, rgba(255, 255, 255, 0.1))",
                padding: "1.5rem",
              }}
            >
              <span style={{ fontSize: "12px", color: "var(--sc-text-dim, #94a3b8)", textTransform: "uppercase", display: "block" }}>
                Active Match Escrow
              </span>
              <strong style={{ fontSize: "1.8rem", color: "#fff", display: "block", margin: "4px 0" }}>
                0.00 XLM
              </strong>
              <span style={{ fontSize: "12px", color: "var(--sc-text-dim, #94a3b8)" }}>
                No rounds in settlement
              </span>
            </div>

            <div
              style={{
                background: "var(--sc-bg-card, rgba(255, 255, 255, 0.04))",
                borderRadius: "16px",
                border: "1px solid var(--sc-border-glass, rgba(255, 255, 255, 0.1))",
                padding: "1.5rem",
              }}
            >
              <span style={{ fontSize: "12px", color: "var(--sc-text-dim, #94a3b8)", textTransform: "uppercase", display: "block" }}>
                Locked Base Reserves
              </span>
              <strong style={{ fontSize: "1.8rem", color: "#fff", display: "block", margin: "4px 0" }}>
                1.50 XLM
              </strong>
              <span style={{ fontSize: "12px", color: "var(--sc-text-dim, #94a3b8)" }}>
                Base ledger reserve (Reclaim on /cleanup)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Rewards */}
      {activeTab === "rewards" && (
        <div
          style={{
            background: "var(--sc-bg-card, rgba(255, 255, 255, 0.04))",
            borderRadius: "16px",
            border: "1px solid var(--sc-border-glass, rgba(255, 255, 255, 0.1))",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <Trophy size={40} style={{ color: "var(--sc-accent, #00ffcc)", margin: "0 auto 12px auto" }} />
          <h3 style={{ fontSize: "1.3rem", fontWeight: 700, margin: "0 0 8px 0" }}>Claimable Prize Vaults</h3>
          <p style={{ color: "var(--sc-text-dim, #94a3b8)", maxWidth: "500px", margin: "0 auto 1.5rem auto", fontSize: "14px" }}>
            You have active tournament winnings and quest milestone rewards waiting for on-chain disbursement.
          </p>
          <Button asChild variant="brand" size="sm">
            <Link href="/rewards">Open Rewards Center</Link>
          </Button>
        </div>
      )}

      {/* Tab 3: Badges */}
      {activeTab === "badges" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {[
            { name: "Early Pioneer", rarity: "Legendary", desc: "First 1,000 players on Stellar testnet." },
            { name: "Provable Auditor", rarity: "Epic", desc: "Executed 10+ offline cryptographic proof audits." },
            { name: "Gauntlet Victor", rarity: "Rare", desc: "Won 5 consecutive multiplier rounds." },
          ].map((badge) => (
            <div
              key={badge.name}
              style={{
                background: "var(--sc-bg-card, rgba(255, 255, 255, 0.04))",
                borderRadius: "16px",
                border: "1px solid var(--sc-border-glass, rgba(255, 255, 255, 0.1))",
                padding: "1.5rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <Award size={24} style={{ color: "var(--sc-accent, #00ffcc)" }} />
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background: "rgba(0, 255, 204, 0.15)",
                    color: "var(--sc-accent, #00ffcc)",
                    textTransform: "uppercase",
                  }}
                >
                  {badge.rarity}
                </span>
              </div>
              <h4 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 4px 0" }}>{badge.name}</h4>
              <p style={{ color: "var(--sc-text-dim, #94a3b8)", fontSize: "13px", margin: 0 }}>{badge.desc}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Portfolio;
