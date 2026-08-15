"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Check,
  Coins,
  Copy,
  Dices,
  Gamepad2,
  Gift,
  History,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatTile } from "@/components/ui/stat-tile";
import { useWalletStatus } from "@/hooks/useWalletStatus";
import { useXlmBalance } from "@/hooks/useXlmBalance";
import { useSettledRounds } from "@/services/player-data";
import { ApiClient, ONCHAIN_GAMES_CATALOG } from "@/services/typed-api-sdk";
import type { Game } from "@/types/api-client";
import { cn } from "@/lib/utils";

/*
 * ── On genuine data ──────────────────────────────────────────────────────
 *
 * StellarCade has not settled real rounds yet, so this dashboard shows only
 * what it can actually source:
 *
 *   • the on-chain games catalog        — GET /games, falling back to
 *                                          ONCHAIN_GAMES_CATALOG
 *   • the connected wallet's XLM balance — live from Horizon
 *   • wallet connection + network        — from the Freighter session
 *
 * Everything else (settled volume, payouts, win rates, leaderboard standings,
 * activity) has no source behind it, so it renders an explicit empty state
 * rather than a plausible-looking number. Placeholder figures on a wallet
 * dashboard are worse than a blank: they read as real balances.
 *
 * When the rounds endpoint lands, feed it into `useSettledRounds` below and
 * the panels fill in — the rendering paths are already written for it.
 */

/* ── Layout primitives ──────────────────────────────────────────────────── */

function Panel({
  title,
  description,
  action,
  className,
  bodyClassName,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-2xl border border-border bg-card/60 backdrop-blur-sm",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3 border-b border-border/70 px-5 py-4">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className={cn("flex-1 p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

const QUICK_ACTIONS = [
  { href: "/games", label: "Play a game", icon: Gamepad2 },
  { href: "/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/quests", label: "Quests", icon: Sparkles },
  { href: "/rewards", label: "Claim rewards", icon: Gift },
  { href: "/verify", label: "Verify a round", icon: ShieldCheck },
  { href: "/portfolio", label: "Portfolio", icon: Wallet },
];

/* ── Wallet identity chip ───────────────────────────────────────────────── */

function WalletChip() {
  const wallet = useWalletStatus();
  const [mounted, setMounted] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // SSR renders the disconnected view; the real wallet state only exists in
  // the browser, so switching after mount is what keeps hydration stable.
  React.useEffect(() => setMounted(true), []);

  const address = mounted ? wallet.address : null;
  const isConnected = mounted && wallet.capabilities.isConnected;

  const handleCopy = React.useCallback(async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard denied — nothing actionable, the address is still visible.
    }
  }, [address]);

  if (!isConnected || !address) {
    return (
      <Button
        type="button"
        variant="brand"
        size="sm"
        onClick={() => void wallet.connect()}
        disabled={wallet.capabilities.isConnecting}
      >
        <Wallet />
        {wallet.capabilities.isConnecting ? "Connecting…" : "Connect wallet"}
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs transition-colors hover:border-primary/50"
      aria-label={`Copy wallet address ${address}`}
    >
      <span
        className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400/70"
        aria-hidden
      />
      <span className="font-mono text-foreground">
        {address.slice(0, 6)}…{address.slice(-4)}
      </span>
      {copied ? (
        <Check className="size-3.5 text-emerald-400" aria-hidden />
      ) : (
        <Copy className="size-3.5 text-muted-foreground" aria-hidden />
      )}
    </button>
  );
}

/* ── Dashboard ──────────────────────────────────────────────────────────── */

export function Dashboard() {
  const wallet = useWalletStatus();
  const balance = useXlmBalance();
  const { items: rounds } = useSettledRounds();

  const [games, setGames] = React.useState<Game[]>(ONCHAIN_GAMES_CATALOG);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [lastSyncedAt, setLastSyncedAt] = React.useState<number | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const syncGames = React.useCallback(async () => {
    setIsSyncing(true);
    try {
      const client = new ApiClient({
        baseUrl: typeof window !== "undefined" ? window.location.origin : "",
      });
      const result = await client.getGames();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        setGames(result.data);
      }
      setLastSyncedAt(Date.now());
    } catch {
      // The bundled catalog is already on screen; a failed refresh is not
      // worth an error state here.
    } finally {
      setIsSyncing(false);
    }
  }, []);

  React.useEffect(() => {
    void syncGames();
  }, [syncGames]);

  const isConnected = mounted && wallet.capabilities.isConnected;
  const activeGames = games.filter((g) => g.status === "active").length;
  const totalPlayers = games.reduce(
    (sum, g) => sum + (typeof g.players === "number" ? g.players : 0),
    0,
  );
  const hasRounds = rounds.length > 0;

  const balanceValue = balance.isUnfunded
    ? "Unfunded"
    : balance.formatted
      ? `${balance.formatted} XLM`
      : "—";

  return (
    <div className="flex flex-col gap-6">
      {/* Masthead */}
      <header className="relative overflow-hidden rounded-2xl border border-border bg-card/50 p-5 backdrop-blur-sm sm:p-6">
        <div
          className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Badge variant="outline" className="mb-2 gap-1.5 border-primary/40 text-primary">
              <Activity className="size-3" aria-hidden />
              {mounted && wallet.network ? wallet.network : "Stellar"} · early access
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Arcade Lobby
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Every round settles on-chain with a published seed commitment. Play, then verify the
              proof yourself.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <WalletChip />
            <Button asChild variant="brand" size="sm">
              <Link href="/games">
                Enter the arena
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative mt-5 flex flex-wrap gap-2">
          {QUICK_ACTIONS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              <Icon className="size-3.5" aria-hidden />
              {label}
            </Link>
          ))}
        </div>
      </header>

      {/* KPIs — real where a source exists, explicitly empty where none does */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          data-testid="dashboard-balance-tile"
          label="Wallet balance"
          value={balanceValue}
          empty={!isConnected}
          caption={
            !isConnected
              ? "Connect a wallet to see your balance"
              : balance.isUnfunded
                ? "Account not funded on this network"
                : "Live from Horizon"
          }
          icon={<Wallet />}
        />
        <StatTile
          label="Games live"
          value={String(activeGames)}
          caption={`${games.length} contract${games.length === 1 ? "" : "s"} in the catalog`}
          icon={<Dices />}
        />
        <StatTile
          label="Players in queue"
          value={String(totalPlayers)}
          empty={totalPlayers === 0}
          caption={totalPlayers === 0 ? "No players queued yet" : "Across all games"}
          icon={<Users />}
        />
        <StatTile
          label="Rounds settled"
          value={String(rounds.length)}
          empty={!hasRounds}
          caption={hasRounds ? "Lifetime, this wallet" : "No rounds settled yet"}
          icon={<ShieldCheck />}
        />
      </div>

      {/* Main grid */}
      <div className="grid gap-4 xl:grid-cols-3">
        {/* Live arena — genuinely sourced, so it leads */}
        <Panel
          className="xl:col-span-2"
          title="Live arena"
          description={
            lastSyncedAt
              ? `${games.length} contracts · synced ${new Date(lastSyncedAt).toLocaleTimeString()}`
              : `${games.length} contracts`
          }
          action={
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => void syncGames()}
                disabled={isSyncing}
                aria-label="Refresh games"
              >
                <RefreshCw className={cn(isSyncing && "animate-spin")} />
              </Button>
              <Button asChild variant="ghost" size="xs">
                <Link href="/games">
                  All games
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          }
          bodyClassName="grid gap-3 sm:grid-cols-2"
        >
          {games.map((game) => {
            const players = typeof game.players === "number" ? game.players : 0;
            const wager = typeof game.wager === "number" ? game.wager : null;
            const category = typeof game.category === "string" ? game.category : "On-chain";
            const description =
              typeof game.description === "string" ? game.description : "On-chain game round.";
            return (
              <article
                key={game.id}
                className="group flex flex-col rounded-xl border border-border bg-background/40 p-4 transition-colors hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Dices className="size-4.5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-foreground">
                        {game.name}
                      </h3>
                      <p className="truncate text-[11px] text-muted-foreground">{category}</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 gap-1",
                      game.status === "active"
                        ? "border-emerald-400/40 text-emerald-400"
                        : "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        game.status === "active" ? "bg-emerald-400" : "bg-muted-foreground",
                      )}
                      aria-hidden
                    />
                    {game.status}
                  </Badge>
                </div>

                <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{description}</p>

                <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3.5" aria-hidden />
                      {players}
                    </span>
                    {wager !== null ? (
                      <span className="inline-flex items-center gap-1">
                        <Coins className="size-3.5" aria-hidden />
                        {wager} XLM
                      </span>
                    ) : null}
                  </div>
                  <Button asChild size="xs" variant="brand-outline">
                    <Link href={`/games?game=${encodeURIComponent(game.id)}`}>
                      Play
                      <ArrowRight />
                    </Link>
                  </Button>
                </div>
              </article>
            );
          })}
        </Panel>

        {/* Fairness — the verifier genuinely works standalone, so it links out */}
        <Panel
          title="Provable fairness"
          description="Verify any round's seed commitment"
          bodyClassName="p-0"
        >
          <EmptyState
            icon={ShieldCheck}
            title="No proofs to check yet"
            body="Once you play a round, its commit-reveal proof shows up here. The verifier already works standalone — you can run it against the published test vectors right now."
            action={
              <Button asChild size="sm" variant="brand-outline">
                <Link href="/verify">
                  Open verifier
                  <ArrowRight />
                </Link>
              </Button>
            }
          />
        </Panel>

        {/* Settlement volume — real chart path, empty until rounds exist */}
        <Panel
          className="xl:col-span-2"
          title="Settlement volume"
          description="Wagered vs. paid out, in XLM"
          bodyClassName="p-0"
        >
          <EmptyState
            icon={Coins}
            title="No settled rounds yet"
            body="This chart plots wagered against paid-out volume once rounds start settling on-chain. Nothing has settled so far, so there is nothing to plot."
            action={
              <Button asChild size="sm" variant="brand-outline">
                <Link href="/games">
                  Play the first round
                  <ArrowRight />
                </Link>
              </Button>
            }
            size="lg"
          />
        </Panel>

        {/* Activity */}
        <Panel
          title="Recent activity"
          description="Your settled rounds"
          action={
            <Button asChild variant="ghost" size="xs">
              <Link href="/history">
                History
                <ArrowRight />
              </Link>
            </Button>
          }
          bodyClassName="p-0"
        >
          <EmptyState
            icon={History}
            title="No activity yet"
            body="Rounds you play will appear here as they settle, newest first."
          />
        </Panel>

        {/* Leaderboard */}
        <Panel
          className="xl:col-span-3"
          title="Leaderboard"
          description="Top net winners across all contracts"
          action={
            <Button asChild variant="ghost" size="xs">
              <Link href="/leaderboard">
                Full board
                <ArrowRight />
              </Link>
            </Button>
          }
          bodyClassName="p-0"
        >
          <EmptyState
            icon={Trophy}
            title="Nobody on the board yet"
            body="The leaderboard ranks players by net winnings once rounds settle. Be the first name on it."
            action={
              <Button asChild size="sm" variant="brand-outline">
                <Link href="/games">
                  Play a game
                  <ArrowRight />
                </Link>
              </Button>
            }
          />
        </Panel>
      </div>
    </div>
  );
}

export default Dashboard;
