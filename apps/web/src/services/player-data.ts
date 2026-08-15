"use client";

/**
 * Player-facing data sources that do not exist yet.
 *
 * StellarCade is pre-launch: the game contracts are stubs, the arbiter's
 * settlement log is not exposed over the API, and no rounds have settled. So
 * none of the surfaces below — match history, leaderboard, tournaments,
 * quests, claimable rewards — have anything real to show.
 *
 * Rather than scatter sample arrays through the route files (where they read
 * as real standings and balances), every one of them is declared here,
 * returns empty, and records exactly what has to exist before it can return
 * anything. Wire the real request into the matching hook and the route that
 * consumes it starts rendering — the components already handle the populated
 * case.
 *
 * The types are the contract those endpoints will have to satisfy, so they
 * are deliberately concrete rather than `unknown`.
 */

export interface SettledRound {
  id: string;
  game: string;
  gameType: "coinflip" | "dice" | "gauntlet";
  wagerXlm: number;
  payoutXlm: number;
  outcome: "WIN" | "LOSS";
  settledAt: number;
  /** Commit-reveal proof material, for deep-linking into /verify. */
  serverSeed: string;
  commitHash: string;
  clientSeed: string;
  nonce: number;
  rangeSize: number;
}

export interface LeaderboardEntry {
  rank: number;
  address: string;
  username: string;
  wins: number;
  totalVolumeXlm: number;
  winRate: string;
}

export interface Tournament {
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

export interface Quest {
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

export interface RewardItem {
  id: string;
  title: string;
  source: string;
  amountXlm: number;
  status: "claimable" | "claimed" | "locked";
  expiry: string;
}

interface Collection<T> {
  items: T[];
  isLoading: boolean;
}

function empty<T>(): Collection<T> {
  return { items: [], isLoading: false };
}

/**
 * Rounds this wallet has settled.
 * Blocked on: the arbiter exposing its settlement log over the API.
 */
export function useSettledRounds(): Collection<SettledRound> {
  return empty();
}

/**
 * Player standings by net winnings.
 * Blocked on: settled rounds existing at all — the board is derived from them.
 */
export function useLeaderboard(): Collection<LeaderboardEntry> {
  return empty();
}

/**
 * Scheduled brackets and their escrowed prize pools.
 * Blocked on: the prize-pool contract (currently a stub) and a scheduler.
 */
export function useTournaments(): Collection<Tournament> {
  return empty();
}

/**
 * Quest milestones and per-player progress.
 * Blocked on: quest progress tracking; XP and Soulbound Badges are unminted.
 */
export function useQuests(): Collection<Quest> {
  return empty();
}

/**
 * Payouts this wallet can claim.
 * Blocked on: the prize-pool contract holding real balances. This one matters
 * most — a sample "125 XLM claimable" reads as money the player owns.
 */
export function useClaimableRewards(): Collection<RewardItem> {
  return empty();
}
