import { describe, it, expect } from 'vitest';
import { runTournament, registerPlayers } from './simulator';
import type { TournamentConfig } from './types';

function makeConfig(overrides: Partial<TournamentConfig> = {}): TournamentConfig {
  return {
    size: 8,
    wager: 100,
    feeBps: 500,
    seed: 42,
    ...overrides,
  };
}

// ─── Tournament state progression ───────────────────────────────────────────

describe('runTournament — state progression', () => {
  it('registers exactly `size` players with unique ids and addresses', () => {
    const summary = runTournament(makeConfig({ size: 8 }));
    expect(summary.players).toHaveLength(8);
    expect(new Set(summary.players.map((p) => p.id)).size).toBe(8);
    expect(new Set(summary.players.map((p) => p.address)).size).toBe(8);
  });

  it('plays log2(size) rounds for a bracket of size 4', () => {
    const summary = runTournament(makeConfig({ size: 4 }));
    expect(summary.rounds).toHaveLength(2); // 4 -> 2 -> 1
  });

  it('plays log2(size) rounds for a bracket of size 8', () => {
    const summary = runTournament(makeConfig({ size: 8 }));
    expect(summary.rounds).toHaveLength(3); // 8 -> 4 -> 2 -> 1
  });

  it('plays log2(size) rounds for a bracket of size 16', () => {
    const summary = runTournament(makeConfig({ size: 16 }));
    expect(summary.rounds).toHaveLength(4); // 16 -> 8 -> 4 -> 2 -> 1
  });

  it('halves the number of matches each round until exactly one match remains', () => {
    const summary = runTournament(makeConfig({ size: 16 }));
    expect(summary.rounds.map((r) => r.matches.length)).toEqual([8, 4, 2, 1]);
  });

  it('every match has a winner that is one of its two players, with distinct scores', () => {
    const summary = runTournament(makeConfig({ size: 16 }));
    for (const round of summary.rounds) {
      for (const match of round.matches) {
        expect([match.player1.id, match.player2.id]).toContain(match.winner.id);
        expect(match.player1Score).not.toBe(match.player2Score);
      }
    }
  });

  it('every round winner reappears as a player in the next round', () => {
    const summary = runTournament(makeConfig({ size: 8 }));
    for (let i = 0; i < summary.rounds.length - 1; i++) {
      const winners = new Set(summary.rounds[i]!.matches.map((m) => m.winner.id));
      const nextRoundPlayers = new Set(
        summary.rounds[i + 1]!.matches.flatMap((m) => [m.player1.id, m.player2.id]),
      );
      for (const winnerId of winners) {
        expect(nextRoundPlayers.has(winnerId)).toBe(true);
      }
    }
  });

  it('produces a champion who won every one of their matches', () => {
    const summary = runTournament(makeConfig({ size: 8 }));
    const championMatches = summary.rounds
      .flatMap((r) => r.matches)
      .filter((m) => m.player1.id === summary.champion.id || m.player2.id === summary.champion.id);
    for (const match of championMatches) {
      expect(match.winner.id).toBe(summary.champion.id);
    }
  });

  it('is deterministic for a fixed seed', () => {
    const a = runTournament(makeConfig({ seed: 7 }));
    const b = runTournament(makeConfig({ seed: 7 }));
    expect(a.champion.id).toBe(b.champion.id);
    expect(a.rounds).toEqual(b.rounds);
  });

  it('rejects a non-power-of-two size', () => {
    expect(() => runTournament(makeConfig({ size: 6 }))).toThrow(/power of two/);
  });

  it('rejects a zero or negative wager', () => {
    expect(() => runTournament(makeConfig({ wager: 0 }))).toThrow(/wager/i);
  });
});

// ─── Winner prize disbursement verification ─────────────────────────────────

describe('runTournament — prize disbursement', () => {
  it('disburses to exactly the champion and runner-up', () => {
    const summary = runTournament(makeConfig({ size: 8 }));
    expect(summary.disbursements).toHaveLength(2);
    const placements = summary.disbursements.map((d) => d.placement).sort();
    expect(placements).toEqual(['champion', 'runner-up']);
  });

  it('the runner-up is the champion\'s opponent in the final match', () => {
    const summary = runTournament(makeConfig({ size: 8 }));
    const finalMatch = summary.rounds[summary.rounds.length - 1]!.matches[0]!;
    const opponentId =
      finalMatch.player1.id === summary.champion.id ? finalMatch.player2.id : finalMatch.player1.id;
    expect(summary.runnerUp.id).toBe(opponentId);
  });

  it('champion receives a strictly larger share than the runner-up', () => {
    const summary = runTournament(makeConfig({ size: 8 }));
    const champion = summary.disbursements.find((d) => d.placement === 'champion')!;
    const runnerUp = summary.disbursements.find((d) => d.placement === 'runner-up')!;
    expect(champion.amount).toBeGreaterThan(runnerUp.amount);
  });

  it('prize pool equals total wagers collected', () => {
    const summary = runTournament(makeConfig({ size: 16, wager: 250 }));
    expect(summary.prizePool).toBe(16 * 250);
  });

  it('protocol fee matches the configured basis points', () => {
    const summary = runTournament(makeConfig({ size: 8, wager: 100, feeBps: 1000 }));
    // prizePool = 800, feeBps=1000 (10%) -> fee = 80
    expect(summary.protocolFee).toBe(80);
  });

  it('disbursed amounts plus fee exactly account for the full prize pool (no trapped funds)', () => {
    const summary = runTournament(makeConfig({ size: 16, wager: 137, feeBps: 333 }));
    const totalDisbursed = summary.disbursements.reduce((sum, d) => sum + d.amount, 0);
    expect(totalDisbursed + summary.protocolFee).toBe(summary.prizePool);
    expect(summary.issues).toEqual([]);
  });

  it('every registered player appears in at least one match (no unmatched players)', () => {
    const summary = runTournament(makeConfig({ size: 16 }));
    const matchedIds = new Set(
      summary.rounds.flatMap((r) => r.matches.flatMap((m) => [m.player1.id, m.player2.id])),
    );
    for (const player of summary.players) {
      expect(matchedIds.has(player.id)).toBe(true);
    }
  });

  it('reports a clean verification (no issues) for every supported bracket size', () => {
    for (const size of [4, 8, 16, 32]) {
      const summary = runTournament(makeConfig({ size, seed: size }));
      expect(summary.issues).toEqual([]);
    }
  });
});

describe('registerPlayers', () => {
  it('generates exactly `size` players', () => {
    const rng = () => Math.random();
    const players = registerPlayers(makeConfig({ size: 4 }), rng);
    expect(players).toHaveLength(4);
  });
});
