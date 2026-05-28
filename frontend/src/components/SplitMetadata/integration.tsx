/**
 * Integration Examples and Documentation
 *
 * This file shows how to integrate the SplitMetadataLayout with
 * real data sources and state management.
 */

import type { MetadataSectionData as MetadataSection } from "./index";

// ──────────────────────────────────────────────────────────────
// Example 1: Game Details Page
// ──────────────────────────────────────────────────────────────

export function buildGameMetadata(game: any): MetadataSection[] {
  return [
    {
      id: "basics",
      title: "Game Basics",
      collapsible: false,
      visible: true,
      fields: [
        {
          id: "name",
          label: "Game Name",
          value: game.name,
          visible: true,
          loading: !game.name,
        },
        {
          id: "type",
          label: "Game Type",
          value: game.type,
          visible: true,
          loading: !game.type,
        },
        {
          id: "status",
          label: "Status",
          value: game.status?.toUpperCase(),
          visible: true,
          loading: !game.status,
        },
      ],
    },
    {
      id: "statistics",
      title: "Statistics",
      collapsible: true,
      defaultOpen: true,
      visible: true,
      fields: [
        {
          id: "players",
          label: "Active Players",
          value: game.playerCount?.toLocaleString(),
          loading: !game.playerCount,
          visible: true,
        },
        {
          id: "rounds",
          label: "Total Rounds",
          value: game.totalRounds?.toLocaleString(),
          loading: !game.totalRounds,
          visible: true,
        },
        {
          id: "avgDuration",
          label: "Avg Duration",
          value: game.averageDuration ? `${game.averageDuration}s` : "N/A",
          loading: !game.averageDuration,
          visible: true,
          helpText: "Average round duration in seconds",
        },
      ],
    },
    {
      id: "economics",
      title: "Rewards & Economics",
      collapsible: true,
      defaultOpen: true,
      visible: true,
      fields: [
        {
          id: "totalPot",
          label: "Total Prize Pool",
          value: game.totalPrizePool ? `${game.totalPrizePool} ${game.currency}` : "N/A",
          loading: !game.totalPrizePool,
          visible: true,
        },
        {
          id: "minEntry",
          label: "Min Entry Fee",
          value: game.minEntryFee ? `${game.minEntryFee} ${game.currency}` : "Free",
          loading: !game.minEntryFee,
          visible: true,
        },
        {
          id: "maxWinrate",
          label: "Max Win %",
          value: game.maxWinPercentage ? `${game.maxWinPercentage}%` : "N/A",
          loading: !game.maxWinPercentage,
          visible: true,
          helpText: "Maximum percentage of prize pool any single player can win",
        },
      ],
    },
  ];
}

// ──────────────────────────────────────────────────────────────
// Example 2: Player Profile Page
// ──────────────────────────────────────────────────────────────

export function buildPlayerMetadata(player: any): MetadataSection[] {
  return [
    {
      id: "profile",
      title: "Profile Info",
      collapsible: false,
      visible: true,
      fields: [
        {
          id: "username",
          label: "Username",
          value: player.username,
          visible: true,
          loading: !player.username,
        },
        {
          id: "joinDate",
          label: "Joined",
          value: player.joinDate ? new Date(player.joinDate).toLocaleDateString() : "N/A",
          visible: true,
          loading: !player.joinDate,
        },
        {
          id: "level",
          label: "Player Level",
          value: player.level,
          visible: true,
          loading: !player.level,
        },
      ],
    },
    {
      id: "performance",
      title: "Performance",
      collapsible: true,
      defaultOpen: true,
      visible: true,
      fields: [
        {
          id: "gamesPlayed",
          label: "Games Played",
          value: player.gamesPlayed?.toLocaleString(),
          visible: true,
          loading: !player.gamesPlayed,
        },
        {
          id: "winrate",
          label: "Win Rate",
          value: player.winRate ? `${(player.winRate * 100).toFixed(1)}%` : "N/A",
          visible: true,
          loading: !player.winRate,
          helpText: "Percentage of games won",
        },
        {
          id: "totalWinnings",
          label: "Total Winnings",
          value: player.totalWinnings ? `${player.totalWinnings} GAME` : "0 GAME",
          visible: true,
          loading: !player.totalWinnings,
        },
      ],
    },
    {
      id: "achievements",
      title: "Achievements",
      collapsible: true,
      defaultOpen: false,
      visible: player.achievements?.length > 0,
      fields:
        player.achievements?.map((ach: any, idx: number) => ({
          id: `achievement-${idx}`,
          label: ach.name,
          value: ach.description,
          visible: true,
          loading: false,
        })) || [],
    },
  ];
}

// ──────────────────────────────────────────────────────────────
// Example 3: Asset/Escrow Details
// ──────────────────────────────────────────────────────────────

export function buildAssetEscrowMetadata(escrow: any): MetadataSection[] {
  return [
    {
      id: "details",
      title: "Escrow Details",
      collapsible: false,
      visible: true,
      fields: [
        {
          id: "escrowId",
          label: "Escrow ID",
          value: escrow.id?.slice(0, 8) + "...",
          visible: true,
          loading: !escrow.id,
          helpText: "Unique identifier for this escrow",
        },
        {
          id: "status",
          label: "Status",
          value: (
            <span className={`status-${escrow.status?.toLowerCase()}`}>
              {escrow.status}
            </span>
          ),
          visible: true,
          loading: !escrow.status,
        },
      ],
    },
    {
      id: "balance",
      title: "Balance Information",
      collapsible: true,
      defaultOpen: true,
      visible: true,
      fields: [
        {
          id: "totalLocked",
          label: "Total Locked",
          value: `${escrow.totalLocked} ${escrow.asset}`,
          visible: true,
          loading: !escrow.totalLocked,
        },
        {
          id: "readyToUnlock",
          label: "Ready to Unlock",
          value: `${escrow.readyToUnlock} ${escrow.asset}`,
          visible: true,
          loading: !escrow.readyToUnlock,
          helpText: "Amount eligible for withdrawal",
        },
        {
          id: "nextUnlockLedger",
          label: "Next Unlock",
          value: `Ledger ${escrow.nextUnlockLedger || "N/A"}`,
          visible: true,
          loading: !escrow.nextUnlockLedger,
        },
      ],
    },
  ];
}

// ──────────────────────────────────────────────────────────────
// Utilities
// ──────────────────────────────────────────────────────────────

/**
 * Format numbers with proper locale and thousand separators
 */
export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format dates consistently
 */
export function formatDate(date: Date | string, includeTime = false): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return includeTime ? d.toLocaleString() : d.toLocaleDateString();
}

/**
 * Build status badge with color
 */
export function statusBadge(
  status: string,
  colorMap: Record<string, string> = {
    active: "#00ffcc",
    paused: "#f59e0b",
    inactive: "#6b7280",
    error: "#ef4444",
  }
) {
  const color = colorMap[status.toLowerCase()] || "#9ca3af";
  return `<span style="color: ${color}; font-weight: 600;">${status}</span>`;
}
