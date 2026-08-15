"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Trophy, Users, Clock } from "lucide-react";
import { motion } from "framer-motion";

import { Badge } from "../../../src/components/ui/badge";
import { Button } from "../../../src/components/ui/button";
import { EmptyState } from "../../../src/components/ui/empty-state";
import { PageHeader } from "../../../src/components/ui/page-header";
import { cn } from "../../../src/lib/utils";
import { useWalletStatus } from "../../../src/hooks/useWalletStatus";
import { useTournaments, type Tournament } from "../../../src/services/player-data";

const STATUS_TONE: Record<Tournament["status"], string> = {
  live: "border-rose-400/40 text-rose-400",
  registration: "border-primary/40 text-primary",
  upcoming: "border-blue-400/40 text-blue-300",
};

const STATUS_LABEL: Record<Tournament["status"], string> = {
  live: "Live match",
  registration: "Registration open",
  upcoming: "Upcoming",
};

export default function TournamentsPage() {
  const wallet = useWalletStatus();
  const { items: tournaments } = useTournaments();
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
      className="mx-auto flex w-full max-w-7xl flex-col gap-6"
    >
      <PageHeader
        icon={<Trophy />}
        title="Tournaments & Brackets"
        description="Compete in scheduled on-chain brackets. Entry fees accumulate into smart contract escrow vaults with automated payout splits."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/leaderboard">View Leaderboards</Link>
            </Button>
            <Button asChild variant="brand" size="sm">
              <Link href="/app">Lobby</Link>
            </Button>
          </>
        }
      />

      {tournaments.length === 0 ? (
        <section className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm">
          <EmptyState
            size="lg"
            icon={Trophy}
            title="No tournaments scheduled yet"
            body="Brackets open once the prize-pool contract is live — entry fees escrow on-chain and payouts split automatically. Nothing is scheduled right now, so there is no pool to enter."
            action={
              <Button asChild size="sm" variant="brand">
                <Link href="/games">Play a game meanwhile</Link>
              </Button>
            }
          />
        </section>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tournaments.map((t, idx) => {
            const isRegistered = registeredIds.includes(t.id);
            const isProcessing = registeringId === t.id;
            const fillPct = Math.round((t.participants / t.maxParticipants) * 100);

            return (
              <motion.article
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="flex flex-col gap-5 rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-sm transition-colors hover:border-primary/40"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className={cn("gap-1.5", STATUS_TONE[t.status])}>
                      {t.status === "live" ? (
                        <span
                          className="size-1.5 animate-pulse rounded-full bg-rose-400"
                          aria-hidden
                        />
                      ) : null}
                      {STATUS_LABEL[t.status]}
                    </Badge>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3.5" aria-hidden />
                      {t.startsIn}
                    </span>
                  </div>

                  <h2 className="mt-3 text-lg font-bold tracking-tight text-foreground">
                    {t.title}
                  </h2>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">{t.category}</p>

                  <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-border/60 bg-background/50 p-3.5">
                    <div>
                      <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">
                        Prize pool
                      </dt>
                      <dd className="font-mono text-lg font-bold tabular-nums text-primary">
                        {t.prizePoolXlm.toLocaleString()} XLM
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">
                        Entry fee
                      </dt>
                      <dd className="font-mono text-lg font-bold tabular-nums text-foreground">
                        {t.entryFeeXlm} XLM
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-auto flex flex-col gap-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3.5" aria-hidden />
                        Registered players
                      </span>
                      <span className="font-mono tabular-nums">
                        {t.participants} / {t.maxParticipants}
                      </span>
                    </div>
                    <div
                      className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border"
                      role="progressbar"
                      aria-valuenow={t.participants}
                      aria-valuemin={0}
                      aria-valuemax={t.maxParticipants}
                      aria-label={`${t.title} registration`}
                    >
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-500"
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant={isRegistered ? "brand-outline" : "brand"}
                    className="w-full"
                    onClick={() => handleRegister(t)}
                    disabled={isRegistered || isProcessing || t.status === "live"}
                  >
                    {isRegistered
                      ? "✓ Registered"
                      : isProcessing
                        ? "Submitting Entry…"
                        : t.status === "live"
                          ? "Bracket In Progress"
                          : !wallet.capabilities.isConnected
                            ? "Connect Wallet to Enter"
                            : `Enter Tournament (${t.entryFeeXlm} XLM)`}
                  </Button>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
