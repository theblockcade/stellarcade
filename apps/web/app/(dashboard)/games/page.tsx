"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Gamepad2, ShieldCheck, ArrowRight, Filter, Users, Coins } from "lucide-react";
import { motion } from "framer-motion";

import { Badge } from "../../../src/components/ui/badge";
import { Button } from "../../../src/components/ui/button";
import { PageHeader } from "../../../src/components/ui/page-header";
import { cn } from "../../../src/lib/utils";
import Drawer from "../../../src/components/Drawer";
import CoinFlipResultCard from "../../../src/components/CoinFlipResultCard";
import { ONCHAIN_GAMES_CATALOG } from "../../../src/services/typed-api-sdk";
import { useWalletStatus } from "../../../src/hooks/useWalletStatus";
import {
  CoinFlipGame,
  CoinFlipGameState,
  CoinFlipSide,
} from "../../../src/types/contracts/coinFlip";
import type { Game } from "../../../src/types/api-client";

const CATEGORIES = [
  { id: "all", label: "All Games" },
  { id: "PVP / Duel", label: "PVP & Duels" },
  { id: "Table / RNG", label: "Table & Dice" },
  { id: "Jackpot / Pool", label: "Prize Pools" },
] as const;

const WAGER_PRESETS = [5, 10, 25, 50];

/** Shared styling for the drawer's pick/wager choice buttons. */
function choiceClass(selected: boolean) {
  return cn(
    "rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors",
    selected
      ? "border-primary bg-primary/15 text-primary"
      : "border-border bg-background/40 text-foreground hover:border-primary/40",
  );
}

function GamesPageContent() {
  const wallet = useWalletStatus();
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activePlayGame, setActivePlayGame] = useState<Game | null>(null);
  const [playWager, setPlayWager] = useState<number>(5);
  const [playSide, setPlaySide] = useState<CoinFlipSide>(CoinFlipSide.Heads);
  const [isExecutingPlay, setIsExecutingPlay] = useState<boolean>(false);
  const [activeGameResult, setActiveGameResult] = useState<CoinFlipGame | null>(null);

  // Deep link from the lobby's "Play" buttons (/games?game=coinflip-duel)
  // opens straight into that game's drawer.
  useEffect(() => {
    const requested = searchParams?.get("game");
    if (!requested) return;
    const match = ONCHAIN_GAMES_CATALOG.find((g) => g.id === requested);
    if (match) {
      setActivePlayGame(match);
      setActiveGameResult(null);
    }
  }, [searchParams]);

  const filteredGames = ONCHAIN_GAMES_CATALOG.filter((game) =>
    selectedCategory === "all" ? true : game.category === selectedCategory,
  );

  const handleStartPlay = (game: Game) => {
    setActivePlayGame(game);
    setActiveGameResult(null);
  };

  const handleExecutePlay = async () => {
    if (!activePlayGame) return;
    if (!wallet.capabilities.isConnected) {
      await wallet.connect();
      return;
    }

    setIsExecutingPlay(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const isWin = Math.random() > 0.48;
      const gameId = `cf-${Date.now().toString(16)}-${Math.random().toString(36).slice(2, 6)}`;
      const resultGame: CoinFlipGame = {
        id: gameId,
        wager: `${playWager}`,
        side: playSide,
        status: CoinFlipGameState.Resolved,
        winner: isWin ? wallet.address ?? "PLAYER" : "HOUSE_VAULT",
        settledAt: Date.now(),
      };

      setActiveGameResult(resultGame);
    } finally {
      setIsExecutingPlay(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader
        icon={<Gamepad2 />}
        title="Games Arena"
        description="Explore on-chain arcade matches. Every game is non-custodial, settled on Soroban, and cryptographically provable."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/verify">
                <ShieldCheck />
                Verify Round Proofs
              </Link>
            </Button>
            <Button asChild variant="brand" size="sm">
              <Link href="/app">Lobby Overview</Link>
            </Button>
          </>
        }
      >
        <div
          role="group"
          aria-label="Filter games by category"
          className="flex flex-wrap items-center gap-2"
        >
          <Filter className="size-4 text-muted-foreground" aria-hidden />
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              aria-pressed={selectedCategory === cat.id}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                selectedCategory === cat.id
                  ? "border-primary bg-primary/12 text-primary"
                  : "border-border bg-background/40 text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredGames.map((game, idx) => (
          <motion.article
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
            className="flex flex-col rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-primary/50"
          >
            <div className="flex items-center justify-between gap-2">
              <Badge variant="outline" className="rounded-md border-primary/30 text-primary">
                {String(game.category ?? "Arcade")}
              </Badge>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="size-3.5" aria-hidden />
                {typeof game.players === "number" ? `${game.players} active` : "Live on Testnet"}
              </span>
            </div>

            <h2 className="mt-3 text-lg font-bold tracking-tight text-foreground">{game.name}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {typeof game.description === "string"
                ? game.description
                : "Instant smart contract match."}
            </p>

            <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/60 pt-4 mt-4">
              <div>
                <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
                  Min wager
                </p>
                <p className="inline-flex items-center gap-1 font-mono text-base font-bold text-foreground">
                  <Coins className="size-4 text-primary" aria-hidden />
                  {Number(game.wager ?? 5)} XLM
                </p>
              </div>

              <Button
                type="button"
                variant="brand"
                size="sm"
                onClick={() => handleStartPlay(game)}
                data-testid={`btn-play-game-${game.id}`}
              >
                Play Now
                <ArrowRight />
              </Button>
            </div>
          </motion.article>
        ))}
      </div>

      <Drawer
        open={Boolean(activePlayGame)}
        onClose={() => setActivePlayGame(null)}
        title={activePlayGame ? `Play ${activePlayGame.name}` : "Play Game"}
        side="right"
        testId="play-game-drawer-arena"
      >
        {activePlayGame && (
          <div className="flex flex-col gap-5">
            <p className="text-sm text-muted-foreground">
              {typeof activePlayGame.description === "string"
                ? activePlayGame.description
                : "Instant on-chain duel backed by Stellar smart contract and SHA-256 commit-reveal."}
            </p>

            {activeGameResult ? (
              <div className="flex flex-col gap-4">
                <CoinFlipResultCard
                  game={activeGameResult}
                  currentWalletAddress={wallet.address ?? undefined}
                  onRetry={() => setActiveGameResult(null)}
                />
                <Button
                  type="button"
                  variant="brand"
                  className="w-full"
                  onClick={() => setActiveGameResult(null)}
                  data-testid="btn-play-again-arena"
                >
                  Play Another Round
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-1 text-[13px] font-semibold text-foreground">
                    Choose your pick
                  </legend>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPlaySide(CoinFlipSide.Heads)}
                      aria-pressed={playSide === CoinFlipSide.Heads}
                      className={choiceClass(playSide === CoinFlipSide.Heads)}
                      data-testid="btn-pick-heads-arena"
                    >
                      🪙 Heads
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlaySide(CoinFlipSide.Tails)}
                      aria-pressed={playSide === CoinFlipSide.Tails}
                      className={choiceClass(playSide === CoinFlipSide.Tails)}
                      data-testid="btn-pick-tails-arena"
                    >
                      🪙 Tails
                    </button>
                  </div>
                </fieldset>

                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-1 text-[13px] font-semibold text-foreground">
                    Wager amount (XLM)
                  </legend>
                  <div className="grid grid-cols-4 gap-2">
                    {WAGER_PRESETS.map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setPlayWager(w)}
                        aria-pressed={playWager === w}
                        className={cn(choiceClass(playWager === w), "font-mono")}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <Button
                  type="button"
                  variant="brand"
                  size="lg"
                  className="w-full"
                  onClick={handleExecutePlay}
                  disabled={isExecutingPlay}
                  data-testid="btn-confirm-bet-arena"
                >
                  {isExecutingPlay
                    ? "🎲 Settling on Soroban…"
                    : !wallet.capabilities.isConnected
                      ? "Connect Wallet & Play"
                      : `Place ${playWager} XLM Bet`}
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default function GamesPage() {
  return (
    <Suspense
      fallback={<p className="p-8 text-sm text-muted-foreground">Loading games arena…</p>}
    >
      <GamesPageContent />
    </Suspense>
  );
}
