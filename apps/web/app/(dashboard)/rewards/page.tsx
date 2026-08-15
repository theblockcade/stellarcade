"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Coins, CheckCircle2, Lock } from "lucide-react";
import { motion } from "framer-motion";

import { Badge } from "../../../src/components/ui/badge";
import { Button } from "../../../src/components/ui/button";
import { EmptyState } from "../../../src/components/ui/empty-state";
import { PageHeader } from "../../../src/components/ui/page-header";
import { StatTile } from "../../../src/components/ui/stat-tile";
import { cn } from "../../../src/lib/utils";
import { useWalletStatus } from "../../../src/hooks/useWalletStatus";
import { useClaimableRewards, type RewardItem } from "../../../src/services/player-data";

export default function RewardsPage() {
  const wallet = useWalletStatus();
  const { items: rewards } = useClaimableRewards();
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

  const hasRewards = rewards.length > 0;
  const claimableTotal = rewards
    .filter((r) => r.status === "claimable" && !claimedIds.includes(r.id))
    .reduce((sum, r) => sum + r.amountXlm, 0);
  const claimedTotal = rewards
    .filter((r) => claimedIds.includes(r.id))
    .reduce((sum, r) => sum + r.amountXlm, 0);
  const lockedTotal = rewards
    .filter((r) => r.status === "locked")
    .reduce((sum, r) => sum + r.amountXlm, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto flex w-full max-w-5xl flex-col gap-6"
    >
      <PageHeader
        icon={<Coins />}
        title="Claimable Rewards & Vaults"
        description="Withdraw your tournament prizes, quest payouts, and accumulated jackpot shares directly to your connected wallet."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/portfolio">View Portfolio</Link>
          </Button>
        }
      />

      {/* These read empty rather than showing sample balances: a placeholder
          "125 XLM claimable" is money the player does not have. */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Ready to claim"
          value={`${claimableTotal.toLocaleString()} XLM`}
          empty={!hasRewards}
          trend={claimableTotal > 0 ? "up" : "flat"}
          caption={hasRewards ? "Available now" : "Nothing to claim yet"}
          icon={<Coins />}
        />
        <StatTile
          label="Disbursed"
          value={`${claimedTotal.toLocaleString()} XLM`}
          empty={!hasRewards}
          caption={hasRewards ? "This session" : "No payouts yet"}
          icon={<CheckCircle2 />}
        />
        <StatTile
          label="Locked in vault"
          value={`${lockedTotal.toLocaleString()} XLM`}
          empty={!hasRewards}
          caption={hasRewards ? "Releases at epoch close" : "No vault balance yet"}
          icon={<Lock />}
        />
      </div>

      {!hasRewards ? (
        <section className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm">
          <EmptyState
            size="lg"
            icon={Coins}
            title="No rewards to claim yet"
            body="Tournament prizes, quest payouts and jackpot shares land here as they are awarded, and settle straight to your wallet from the prize-pool contract. You have not earned any yet."
            action={
              <Button asChild size="sm" variant="brand">
                <Link href="/games">Start playing</Link>
              </Button>
            }
          />
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
          {rewards.map((rew, idx) => {
            const isClaimed = claimedIds.includes(rew.id);
            const isProcessing = claimingId === rew.id;
            const isClaimable = rew.status === "claimable" && !isClaimed;

            return (
              <motion.li
                key={rew.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.08 }}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-5 rounded-2xl border bg-card/60 p-5 backdrop-blur-sm",
                  isClaimable ? "border-primary/50" : "border-border",
                )}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-md",
                        isClaimable ? "border-primary/40 text-primary" : "text-muted-foreground",
                      )}
                    >
                      {rew.source}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{rew.expiry}</span>
                  </div>

                  <h2 className="mt-2 text-base font-bold text-foreground">{rew.title}</h2>
                  <p className="mt-0.5 font-mono text-xl font-bold tabular-nums text-primary">
                    {rew.amountXlm.toLocaleString()} XLM
                  </p>
                </div>

                <div className="shrink-0">
                  {isClaimed ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                      <CheckCircle2 className="size-4.5" aria-hidden />
                      Payout Disbursed
                    </span>
                  ) : rew.status === "claimable" ? (
                    <Button
                      type="button"
                      variant="brand"
                      onClick={() => handleClaim(rew)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Signing on Soroban…" : "Claim Payout"}
                    </Button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
                      <Lock className="size-4" aria-hidden />
                      Locked until Epoch Close
                    </span>
                  )}
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </motion.div>
  );
}
