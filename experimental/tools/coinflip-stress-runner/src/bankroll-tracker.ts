import type { PlayerStats, StressTestConfig, StressTestSummary } from './types';

// ─── Statistical Helpers ─────────────────────────────────────────────────────

/**
 * Wilson score confidence interval for a binomial proportion.
 * Returns the half-width of the 95% CI.
 */
function wilsonCI95(hits: number, trials: number): number {
  if (trials === 0) return 0;
  const z = 1.96; // 95% CI
  const p = hits / trials;
  const n = trials;
  const denominator = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / denominator;
  const spread = (z / denominator) * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  // Return the half-width (max distance from centre to either bound).
  return Math.max(centre + spread - p, p - (centre - spread));
}

/**
 * Standard error of the mean.
 */
function standardError(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance / values.length);
}

/**
 * 95% confidence interval half-width for a mean.
 */
function meanCI95(values: number[]): number {
  return 1.96 * standardError(values);
}

// ─── Bankroll Tracker ────────────────────────────────────────────────────────

export class BankrollTracker {
  private globalDelta = 0;
  private readonly playerDeltas = new Map<string, number>();
  private readonly roundDeltas: number[] = [];

  /**
   * Record the bankroll change from a single round for a player.
   * A negative delta means the house gained (player lost).
   */
  recordRound(playerId: string, betAmount: number, won: boolean): void {
    const delta = won ? betAmount : -betAmount;
    this.globalDelta += delta;
    this.roundDeltas.push(delta);

    const current = this.playerDeltas.get(playerId) ?? 0;
    this.playerDeltas.set(playerId, current + delta);
  }

  getGlobalDelta(): number {
    return this.globalDelta;
  }

  getPlayerDelta(playerId: string): number {
    return this.playerDeltas.get(playerId) ?? 0;
  }

  getPlayerDeltas(): Map<string, number> {
    return new Map(this.playerDeltas);
  }

  /**
   * Generate the full stress test summary with statistical analysis.
   */
  generateSummary(
    config: StressTestConfig,
    players: PlayerStats[],
    transcript: string[],
  ): StressTestSummary {
    const totalWagered = players.reduce((s, p) => s + p.totalWagered, 0);
    const totalPayout = players.reduce((s, p) => s + p.totalPayout, 0);
    const totalRounds = players.reduce((s, p) => s + p.roundsPlayed, 0);

    // Observed payout ratio: total paid out / total wagered.
    const observedPayoutRatio = totalWagered > 0 ? totalPayout / totalWagered : 0;

    // Expected payout ratio for a 50/50 game with 2% house edge is 0.98.
    const expectedPayoutRatio = 0.98;

    // House edge in basis points (positive = house profits).
    const houseEdgeBps = Math.round((1 - observedPayoutRatio) * 10_000);

    // Confidence interval: compute win-rate CI across all players.
    const totalWins = players.reduce((s, p) => s + p.wins, 0);
    const winRateCI = wilsonCI95(totalWins, totalRounds);

    // Profit per player CI.
    const netProfits = players.map((p) => p.netProfit);
    const profitCI = meanCI95(netProfits);

    // Use the win-rate CI as a proxy for house edge CI.
    const confidenceIntervalHalfWidth = Math.round(winRateCI * 10_000);

    // Verification checks.
    const issues: string[] = [];

    if (players.length === 0) {
      issues.push('No bots were run — no data to analyze.');
    }

    if (totalRounds === 0) {
      issues.push('No rounds were played across all bots.');
    }

    // Check that at least some bots went bankrupt.
    const bankruptBots = players.filter((p) => p.minBalance <= 0);
    if (bankruptBots.length > 0) {
      transcript.push(
        `[WARN] ${bankruptBots.length} bot(s) went bankrupt (balance hit 0 or below): ` +
        bankruptBots.map((p) => p.id).join(', '),
      );
    }

    // Check for runaway martingale/fibonacci bet sizes.
    for (const player of players) {
      if (player.strategy === 'martingale' || player.strategy === 'fibonacci') {
        const maxBet = Math.max(...player.rounds.map((r) => r.bet));
        if (maxBet > player.totalWagered * 0.5) {
          issues.push(
            `${player.id} (${player.strategy}): max bet ${maxBet} exceeds 50% of total wagered ${player.totalWagered}.`,
          );
        }
      }
    }

    // Check overall house edge reasonableness (should be near 2%).
    if (totalRounds > 1000) {
      const deviation = Math.abs(houseEdgeBps - 200);
      if (deviation > 100) {
        issues.push(
          `Observed house edge ${houseEdgeBps}bps deviates significantly from expected 200bps (2%).`,
        );
      }
    }

    return {
      config,
      players,
      globalBankrollDelta: this.globalDelta,
      houseEdgeBps,
      totalRounds,
      totalWagered,
      totalPayout,
      confidenceIntervalHalfWidth,
      expectedPayoutRatio,
      observedPayoutRatio,
      issues,
      transcript,
    };
  }
}

// ─── Formatted Report Output ─────────────────────────────────────────────────

/**
 * Generates a formatted text report from a stress test summary.
 */
export function formatReport(summary: StressTestSummary): string[] {
  const lines: string[] = [];

  lines.push('='.repeat(72));
  lines.push('  COINFLIP STRESS TEST REPORT');
  lines.push('='.repeat(72));
  lines.push('');

  // Config section
  lines.push('Configuration:');
  lines.push(`  Strategy:        ${summary.config.strategy}`);
  lines.push(`  Rounds/bot:      ${summary.config.rounds}`);
  lines.push(`  Bots:            ${summary.config.concurrency}`);
  lines.push(`  Starting balance: ${summary.config.startingBalance}`);
  lines.push(`  Base bet:        ${summary.config.baseBet}`);
  if (summary.config.seed !== undefined) {
    lines.push(`  Seed:            ${summary.config.seed}`);
  }
  lines.push('');

  // Global stats
  lines.push('Global Statistics:');
  lines.push(`  Total rounds:      ${summary.totalRounds}`);
  lines.push(`  Total wagered:     ${summary.totalWagered}`);
  lines.push(`  Total payout:      ${summary.totalPayout}`);
  lines.push(`  House edge:        ${summary.houseEdgeBps} bps (${(summary.houseEdgeBps / 100).toFixed(2)}%)`);
  lines.push(`  Expected payout:   ${(summary.expectedPayoutRatio * 100).toFixed(2)}%`);
  lines.push(`  Observed payout:   ${(summary.observedPayoutRatio * 100).toFixed(2)}%`);
  lines.push(`  Global bankroll delta: ${summary.globalBankrollDelta >= 0 ? '+' : ''}${summary.globalBankrollDelta}`);
  lines.push(`  95% CI half-width: ${summary.confidenceIntervalHalfWidth} bps`);
  lines.push('');

  // Per-player table
  lines.push('Per-Player Results:');
  lines.push(
    padRight('  Player', 20) +
    padRight('Strategy', 12) +
    padRight('Rounds', 8) +
    padRight('Wins', 7) +
    padRight('Losses', 8) +
    padRight('Win%', 8) +
    padRight('Wagered', 10) +
    padRight('Payout', 10) +
    padRight('Net', 10) +
    padRight('Gas', 8),
  );
  lines.push('  ' + '-'.repeat(101));

  for (const player of summary.players) {
    lines.push(
      padRight(`  ${player.id}`, 20) +
      padRight(player.strategy, 12) +
      padRight(String(player.roundsPlayed), 8) +
      padRight(String(player.wins), 7) +
      padRight(String(player.losses), 8) +
      padRight(`${(player.winRate * 100).toFixed(1)}%`, 8) +
      padRight(String(player.totalWagered), 10) +
      padRight(String(player.totalPayout), 10) +
      padRight(formatSignedInt(player.netProfit), 10) +
      padRight(String(player.gasSpent), 8),
    );
  }

  lines.push('');

  // Streak stats
  lines.push('Streak Statistics:');
  for (const player of summary.players) {
    lines.push(
      `  ${player.id}: longest win streak = ${player.longestWinStreak}, ` +
      `longest loss streak = ${player.longestLoseStreak}`,
    );
  }
  lines.push('');

  // Balance range
  lines.push('Balance Ranges:');
  for (const player of summary.players) {
    lines.push(
      `  ${player.id}: min = ${player.minBalance}, max = ${player.maxBalance}`,
    );
  }
  lines.push('');

  // Issues
  if (summary.issues.length > 0) {
    lines.push('Issues:');
    for (const issue of summary.issues) {
      lines.push(`  [!] ${issue}`);
    }
  } else {
    lines.push('Verification: PASSED — no issues detected.');
  }

  lines.push('');

  // Transcript
  if (summary.transcript.length > 0) {
    lines.push('Transcript:');
    for (const line of summary.transcript) {
      lines.push(`  ${line}`);
    }
    lines.push('');
  }

  lines.push('='.repeat(72));

  return lines;
}

function padRight(str: string, width: number): string {
  if (str.length >= width) return str;
  return str + ' '.repeat(width - str.length);
}

function formatSignedInt(n: number): string {
  return n >= 0 ? `+${n}` : String(n);
}
