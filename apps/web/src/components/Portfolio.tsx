"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Wallet, Coins, Award, ShieldCheck, Trophy } from "lucide-react";
import { Button } from "./ui/button";
import { useWalletStatus } from "../hooks/useWalletStatus";
import { motion } from "framer-motion";

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

/**
 * Every number and badge name here used to be hardcoded ("145.50 XLM",
 * "Early Pioneer" etc.) regardless of what was passed via `state` — the
 * `state` prop was destructured and never read. Fixed to actually render
 * from it: real balance, real reward/collectible lists, honest empty states
 * when there's nothing to show. Kept the tabbed layout (Balances/Rewards/
 * Badges) since that's a genuine UI improvement over the previous version.
 */
export const Portfolio: React.FC<PortfolioProps> = ({
  state,
  onOpenWallet,
  onBrowseRewards,
  onBrowseCollectibles,
}) => {
  const wallet = useWalletStatus();
  const [activeTab, setActiveTab] = useState<"balances" | "rewards" | "badges">("balances");

  const walletSection = state?.wallet;
  const walletData = walletSection?.items[0];
  const rewardsSection = state?.rewards;
  const collectiblesSection = state?.collectibles;

  // null (not "0.00 XLM") when there's no real balance to show — the CTA
  // renders instead of guessing a number. `wallet.capabilities.isConnected`
  // (live Freighter session state) is deliberately NOT used to decide this:
  // it answers "is a wallet connected", not "do we have portfolio data",
  // and conflating them previously made the empty-state CTA silently never
  // appear whenever a wallet happened to be connected but state hadn't
  // loaded yet.
  const displayBalance = walletData !== undefined ? `${walletData.availableBalance.toFixed(2)} XLM` : null;
  const displayNetwork = walletData?.networkLabel ?? wallet.network ?? "Stellar Testnet";

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
            <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>Portfolio</h1>
          </div>
          <p style={{ color: "var(--sc-text-dim, #94a3b8)", margin: 0, fontSize: "1rem" }}>
            Your available XLM, claimable rewards, and on-chain badges.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <Button asChild variant="outline" size="sm">
            <Link href="/cleanup">
              <ShieldCheck size={14} style={{ marginRight: "6px" }} /> Cleanup
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
      <div style={{ display: "flex", gap: "8px", marginBottom: "1.5rem" }} data-testid="portfolio-tabs">
        {(
          [
            { id: "balances", label: "Wallet Balance" },
            { id: "rewards", label: "Rewards" },
            { id: "badges", label: "Badges" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            data-testid={`portfolio-tab-${tab.id}`}
            style={{
              padding: "8px 18px",
              borderRadius: "8px",
              border: activeTab === tab.id ? "1px solid #00ffcc" : "1px solid rgba(255,255,255,0.1)",
              background: activeTab === tab.id ? "rgba(0, 255, 204, 0.15)" : "transparent",
              color: activeTab === tab.id ? "#00ffcc" : "#fff",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Balances */}
      {activeTab === "balances" && (
        <div data-testid="portfolio-wallet-section">
          {walletSection?.status === "loading" && (
            <div data-testid="portfolio-wallet-loading" aria-busy="true" style={{ color: "var(--sc-text-dim, #94a3b8)" }}>
              Loading wallet balance…
            </div>
          )}

          {walletSection?.status === "error" && (
            <div data-testid="portfolio-wallet-error" role="alert" style={{ color: "#f87171" }}>
              {walletSection.errorMessage ?? "Failed to load wallet balance."}
            </div>
          )}

          {walletSection?.status !== "loading" && walletSection?.status !== "error" && (
            <div
              style={{
                background: "var(--sc-bg-card, rgba(255, 255, 255, 0.04))",
                borderRadius: "16px",
                border: "1px solid var(--sc-border-glass, rgba(255, 255, 255, 0.1))",
                padding: "1.5rem",
                maxWidth: "320px",
              }}
              data-testid={displayBalance !== null ? "portfolio-wallet-populated" : "portfolio-wallet-missing"}
            >
              <span
                style={{
                  fontSize: "12px",
                  color: "var(--sc-text-dim, #94a3b8)",
                  textTransform: "uppercase",
                  display: "block",
                }}
              >
                Available Balance
              </span>
              <strong style={{ fontSize: "1.8rem", color: "var(--sc-accent, #00ffcc)", display: "block", margin: "4px 0" }}>
                {displayBalance ?? "—"}
              </strong>
              <span style={{ fontSize: "12px", color: "var(--sc-text-dim, #94a3b8)" }}>{displayNetwork}</span>
              {displayBalance === null && onOpenWallet && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onOpenWallet}
                  data-testid="portfolio-wallet-empty-action-0"
                  style={{ marginTop: "12px" }}
                >
                  Open wallet
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Rewards */}
      {activeTab === "rewards" && (
        <div data-testid="portfolio-rewards-section">
          {rewardsSection?.status === "loading" && (
            <div data-testid="portfolio-rewards-loading" aria-busy="true" style={{ color: "var(--sc-text-dim, #94a3b8)" }}>
              Loading rewards…
            </div>
          )}

          {rewardsSection?.status === "error" && (
            <div data-testid="portfolio-rewards-error" role="alert" style={{ color: "#f87171" }}>
              {rewardsSection.errorMessage ?? "Failed to load rewards."}
            </div>
          )}

          {rewardsSection?.status !== "loading" &&
            rewardsSection?.status !== "error" &&
            (rewardsSection?.items.length ? (
              <ul
                data-testid="portfolio-rewards-populated"
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {rewardsSection.items.map((reward) => (
                  <li
                    key={reward.id}
                    style={{
                      background: "var(--sc-bg-card, rgba(255, 255, 255, 0.04))",
                      borderRadius: "12px",
                      border: "1px solid var(--sc-border-glass, rgba(255, 255, 255, 0.1))",
                      padding: "1rem 1.25rem",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{reward.title}</span>
                    <strong style={{ color: "var(--sc-accent, #00ffcc)" }}>{reward.amountLabel}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <div
                data-testid="portfolio-rewards-empty"
                style={{
                  background: "var(--sc-bg-card, rgba(255, 255, 255, 0.04))",
                  borderRadius: "16px",
                  border: "1px solid var(--sc-border-glass, rgba(255, 255, 255, 0.1))",
                  padding: "2rem",
                  textAlign: "center",
                }}
              >
                <Trophy size={40} style={{ color: "var(--sc-accent, #00ffcc)", margin: "0 auto 12px auto" }} />
                <h3 style={{ fontSize: "1.3rem", fontWeight: 700, margin: "0 0 8px 0" }}>No rewards yet</h3>
                <p
                  style={{
                    color: "var(--sc-text-dim, #94a3b8)",
                    maxWidth: "500px",
                    margin: "0 auto 1.5rem auto",
                    fontSize: "14px",
                  }}
                >
                  Play a round or complete a quest to start earning claimable rewards.
                </p>
                {onBrowseRewards && (
                  <Button
                    type="button"
                    variant="brand"
                    size="sm"
                    onClick={onBrowseRewards}
                    data-testid="portfolio-rewards-empty-action-0"
                  >
                    Browse games
                  </Button>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Tab 3: Badges */}
      {activeTab === "badges" && (
        <div data-testid="portfolio-collectibles-section">
          {collectiblesSection?.status === "loading" && (
            <div
              data-testid="portfolio-collectibles-loading"
              aria-busy="true"
              style={{ color: "var(--sc-text-dim, #94a3b8)" }}
            >
              Loading badges…
            </div>
          )}

          {collectiblesSection?.status === "error" && (
            <div data-testid="portfolio-collectibles-error" role="alert" style={{ color: "#f87171" }}>
              {collectiblesSection.errorMessage ?? "Failed to load badges."}
            </div>
          )}

          {collectiblesSection?.status !== "loading" &&
            collectiblesSection?.status !== "error" &&
            (collectiblesSection?.items.length ? (
              <div
                data-testid="portfolio-collectibles-populated"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "1.25rem",
                }}
              >
                {collectiblesSection.items.map((badge) => (
                  <div
                    key={badge.id}
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
                    <h4 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>{badge.name}</h4>
                  </div>
                ))}
              </div>
            ) : (
              <div
                data-testid="portfolio-collectibles-empty"
                style={{
                  background: "var(--sc-bg-card, rgba(255, 255, 255, 0.04))",
                  borderRadius: "16px",
                  border: "1px solid var(--sc-border-glass, rgba(255, 255, 255, 0.1))",
                  padding: "2rem",
                  textAlign: "center",
                }}
              >
                <Award size={40} style={{ color: "var(--sc-accent, #00ffcc)", margin: "0 auto 12px auto" }} />
                <h3 style={{ fontSize: "1.3rem", fontWeight: 700, margin: "0 0 8px 0" }}>No badges yet</h3>
                <p
                  style={{
                    color: "var(--sc-text-dim, #94a3b8)",
                    maxWidth: "500px",
                    margin: "0 auto 1.5rem auto",
                    fontSize: "14px",
                  }}
                >
                  Badges are earned by completing quests and milestones — none have been minted to this account yet.
                </p>
                {onBrowseCollectibles && (
                  <Button
                    type="button"
                    variant="brand"
                    size="sm"
                    onClick={onBrowseCollectibles}
                    data-testid="portfolio-collectibles-empty-action-0"
                  >
                    Browse quests
                  </Button>
                )}
              </div>
            ))}
        </div>
      )}
    </motion.div>
  );
};

export default Portfolio;
