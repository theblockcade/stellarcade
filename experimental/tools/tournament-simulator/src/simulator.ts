import type {
  MatchOutcome,
  MockPlayer,
  PrizeDisbursement,
  RoundResult,
  TournamentConfig,
  TournamentSummary,
} from './types';

/** Deterministic PRNG (mulberry32) so a given `--seed` always reproduces
 * the same bracket outcomes — useful for debugging a specific run. */
function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fakeTxHash(rng: () => number): string {
  let hash = '';
  const chars = '0123456789abcdef';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(rng() * chars.length)];
  }
  return hash;
}

function isPowerOfTwo(n: number): boolean {
  return n >= 2 && (n & (n - 1)) === 0;
}

/** Registers `size` mock players with generated ids/addresses. */
export function registerPlayers(config: TournamentConfig, rng: () => number): MockPlayer[] {
  return Array.from({ length: config.size }, (_, i) => ({
    id: `player_${i + 1}`,
    address: `G${fakeTxHash(rng).slice(0, 55).toUpperCase()}`,
  }));
}

/**
 * Plays out one round: pairs adjacent players, simulates a random score
 * for each, and advances the higher score. Scores are never tied (retried
 * on a tie) so every match has a clear winner, matching a real contract's
 * `submit_score` -> `advance_winner` flow having no draw state to resolve.
 */
function playRound(
  players: MockPlayer[],
  roundNumber: number,
  rng: () => number,
): RoundResult {
  const matches: MatchOutcome[] = [];

  for (let i = 0; i < players.length; i += 2) {
    const player1 = players[i]!;
    const player2 = players[i + 1]!;

    let player1Score: number;
    let player2Score: number;
    do {
      player1Score = Math.floor(rng() * 100);
      player2Score = Math.floor(rng() * 100);
    } while (player1Score === player2Score);

    const winner = player1Score > player2Score ? player1 : player2;

    matches.push({
      matchId: `r${roundNumber}_m${i / 2 + 1}`,
      round: roundNumber,
      player1,
      player2,
      winner,
      player1Score,
      player2Score,
      txHash: fakeTxHash(rng),
    });
  }

  return { round: roundNumber, matches };
}

/**
 * Runs a full single-elimination tournament: registration, every round
 * from the initial bracket down to the final, prize disbursement, and an
 * accounting verification pass.
 *
 * Throws only for a malformed config (non-power-of-two size) — every
 * other irregularity (which shouldn't occur given this simulator's own
 * logic, but would in a real contract integration) is recorded in
 * `issues` rather than thrown, so a partial transcript is still useful
 * for debugging.
 */
export function runTournament(config: TournamentConfig): TournamentSummary {
  if (!isPowerOfTwo(config.size)) {
    throw new Error(
      `Tournament size must be a power of two (4, 8, 16, 32, ...), got ${config.size}`,
    );
  }
  if (config.wager <= 0) {
    throw new Error('Wager amount must be greater than zero');
  }

  const rng = makeRng(config.seed ?? Date.now());
  const transcript: string[] = [];
  const issues: string[] = [];

  const players = registerPlayers(config, rng);
  transcript.push(`Registered ${players.length} players.`);
  for (const player of players) {
    transcript.push(`  ${player.id} -> ${player.address} (registration tx pending)`);
  }

  const prizePool = config.wager * players.length;
  transcript.push(`Prize pool: ${prizePool} (${players.length} x ${config.wager} wager).`);

  const rounds: RoundResult[] = [];
  let survivors = players;
  let roundNumber = 1;

  while (survivors.length > 1) {
    const result = playRound(survivors, roundNumber, rng);
    rounds.push(result);
    transcript.push(`\nRound ${roundNumber} (${survivors.length} players):`);
    for (const match of result.matches) {
      transcript.push(
        `  ${match.matchId}: ${match.player1.id} (${match.player1Score}) vs ` +
          `${match.player2.id} (${match.player2Score}) -> winner ${match.winner.id} ` +
          `[tx ${match.txHash.slice(0, 12)}...]`,
      );
    }
    survivors = result.matches.map((m) => m.winner);
    roundNumber += 1;
  }

  const champion = survivors[0];
  if (!champion) {
    issues.push('No champion emerged — bracket produced zero survivors after the final round.');
  }

  const finalRound = rounds[rounds.length - 1];
  const finalMatch = finalRound?.matches[0];
  const runnerUp = finalMatch
    ? finalMatch.player1.id === champion?.id
      ? finalMatch.player2
      : finalMatch.player1
    : undefined;
  if (!runnerUp) {
    issues.push('No runner-up identified from the final match.');
  }

  const protocolFee = Math.floor((prizePool * config.feeBps) / 10_000);
  const distributable = prizePool - protocolFee;
  // Standard split: champion takes 70% of the distributable pool,
  // runner-up 30% — mirrors the "champion payout and runner-up payouts"
  // acceptance criterion without assuming winner-takes-all.
  const championShare = Math.floor(distributable * 0.7);
  const runnerUpShare = distributable - championShare;

  const disbursements: PrizeDisbursement[] = [];
  if (champion) {
    disbursements.push({
      player: champion,
      placement: 'champion',
      amount: championShare,
      txHash: fakeTxHash(rng),
    });
  }
  if (runnerUp) {
    disbursements.push({
      player: runnerUp,
      placement: 'runner-up',
      amount: runnerUpShare,
      txHash: fakeTxHash(rng),
    });
  }

  transcript.push(`\nFinal: champion ${champion?.id ?? 'NONE'}, runner-up ${runnerUp?.id ?? 'NONE'}.`);
  transcript.push(
    `Prize pool ${prizePool} - fee ${protocolFee} = ${distributable} distributable ` +
      `(champion ${championShare}, runner-up ${runnerUpShare}).`,
  );

  // ─── Accounting verification ────────────────────────────────────────────
  const totalDisbursed = disbursements.reduce((sum, d) => sum + d.amount, 0);
  const totalAccounted = totalDisbursed + protocolFee;
  if (totalAccounted !== prizePool) {
    issues.push(
      `Trapped funds detected: prize pool ${prizePool} != disbursed ${totalDisbursed} + fee ${protocolFee} ` +
        `(${prizePool - totalAccounted} unaccounted for).`,
    );
  }

  const allMatchedPlayerIds = new Set(rounds.flatMap((r) => r.matches.flatMap((m) => [m.player1.id, m.player2.id])));
  for (const player of players) {
    if (!allMatchedPlayerIds.has(player.id)) {
      issues.push(`Unmatched player detected: ${player.id} never appeared in any round.`);
    }
  }

  transcript.push(
    issues.length === 0
      ? '\nVerification: PASSED — no trapped funds, no unmatched players.'
      : `\nVerification: FAILED — ${issues.length} issue(s) found:\n` +
          issues.map((issue) => `  - ${issue}`).join('\n'),
  );

  return {
    config,
    players,
    rounds,
    champion: champion as MockPlayer,
    runnerUp: runnerUp as MockPlayer,
    prizePool,
    protocolFee,
    disbursements,
    issues,
    transcript,
  };
}
