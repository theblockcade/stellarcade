import { describe, it, expect } from 'vitest';
import {
  buildReplaySteps,
  findMatch,
  MatchNotFoundError,
  parseMatchHistory,
  UnsupportedGameTypeError,
} from './replayer';
import type { MatchRecord } from './types';

describe('parseMatchHistory', () => {
  it('parses a well-formed rock-paper-scissors match', () => {
    const raw = {
      matchId: 'match-1',
      gameType: 'rock-paper-scissors',
      players: ['GALICE', 'GBOB'],
      wagerXlm: 50,
      moves: [
        { player: 'GALICE', timestamp: '2026-08-24T00:00:00Z', data: { choice: 'rock' } },
        { player: 'GBOB', timestamp: '2026-08-24T00:00:01Z', data: { choice: 'scissors' } },
      ],
      outcome: { winner: 'GALICE', settledAt: '2026-08-24T00:00:02Z' },
    };

    const { record, warnings } = parseMatchHistory(raw);

    expect(warnings).toHaveLength(0);
    expect(record.matchId).toBe('match-1');
    expect(record.gameType).toBe('rock-paper-scissors');
    expect(record.moves).toHaveLength(2);
    expect(record.moves[0].moveIndex).toBe(0);
    expect(record.moves[1].moveIndex).toBe(1);
    expect(record.outcome).toEqual({ winner: 'GALICE', settledAt: '2026-08-24T00:00:02Z' });
  });

  it('parses dice, matrix, and trivia game types', () => {
    for (const gameType of ['dice', 'matrix', 'trivia']) {
      const { record } = parseMatchHistory({
        matchId: `m-${gameType}`,
        gameType,
        players: ['GALICE'],
        moves: [],
      });
      expect(record.gameType).toBe(gameType);
    }
  });

  it('throws UnsupportedGameTypeError for an unknown game type', () => {
    expect(() =>
      parseMatchHistory({ matchId: 'm1', gameType: 'chess', players: [], moves: [] }),
    ).toThrow(UnsupportedGameTypeError);
  });

  it('throws for a non-object payload', () => {
    expect(() => parseMatchHistory(null)).toThrow();
    expect(() => parseMatchHistory('not an object')).toThrow();
    expect(() => parseMatchHistory(42)).toThrow();
  });

  it('skips corrupt individual moves without throwing (handles corrupt data gracefully)', () => {
    const raw = {
      matchId: 'm1',
      gameType: 'dice',
      players: ['GALICE'],
      moves: [
        { player: 'GALICE', timestamp: '2026-08-24T00:00:00Z', data: { value: 4 } },
        null, // corrupt entry
        'not an object', // corrupt entry
        { player: 'GALICE', data: {} }, // missing timestamp — still valid
        { data: { value: 2 } }, // missing player — skipped
      ],
    };

    const { record, warnings } = parseMatchHistory(raw);

    expect(record.moves).toHaveLength(2);
    expect(warnings.length).toBeGreaterThanOrEqual(3);
    // moveIndex is re-numbered contiguously over the surviving moves.
    expect(record.moves[0].moveIndex).toBe(0);
    expect(record.moves[1].moveIndex).toBe(1);
  });

  it('produces a warning when players is missing or empty, without throwing', () => {
    const { record, warnings } = parseMatchHistory({
      matchId: 'm1',
      gameType: 'dice',
      moves: [],
    });

    expect(record.players).toEqual([]);
    expect(warnings.some((w) => w.includes('players'))).toBe(true);
  });

  it('treats a malformed outcome as unfinalized with a warning, not a throw', () => {
    const { record, warnings } = parseMatchHistory({
      matchId: 'm1',
      gameType: 'dice',
      players: ['GALICE'],
      moves: [],
      outcome: { winner: 123 }, // malformed: winner must be a string
    });

    expect(record.outcome).toBeUndefined();
    expect(warnings.some((w) => w.includes('Outcome'))).toBe(true);
  });

  it('defaults wagerXlm to 0 when absent or non-numeric', () => {
    const { record } = parseMatchHistory({
      matchId: 'm1',
      gameType: 'dice',
      players: [],
      moves: [],
      wagerXlm: 'not-a-number',
    });
    expect(record.wagerXlm).toBe(0);
  });
});

describe('findMatch', () => {
  const matches: MatchRecord[] = [
    { matchId: 'a', gameType: 'dice', players: [], wagerXlm: 0, moves: [] },
    { matchId: 'b', gameType: 'dice', players: [], wagerXlm: 0, moves: [] },
  ];

  it('finds a match by id', () => {
    expect(findMatch(matches, 'b').matchId).toBe('b');
  });

  it('throws MatchNotFoundError for an unknown id with a clear message', () => {
    expect(() => findMatch(matches, 'missing')).toThrow(MatchNotFoundError);
    try {
      findMatch(matches, 'missing');
    } catch (err) {
      expect((err as Error).message).toContain('missing');
    }
  });
});

describe('buildReplaySteps (state machine: initial -> move 1 -> move 2 -> settled)', () => {
  const rpsRecord: MatchRecord = {
    matchId: 'm1',
    gameType: 'rock-paper-scissors',
    players: ['GALICE', 'GBOB'],
    wagerXlm: 10,
    moves: [
      { moveIndex: 0, player: 'GALICE', timestamp: 't0', data: { choice: 'rock' } },
      { moveIndex: 1, player: 'GBOB', timestamp: 't1', data: { choice: 'scissors' } },
    ],
    outcome: { winner: 'GALICE', settledAt: 't2' },
  };

  it('produces one initial step plus one step per move', () => {
    const steps = buildReplaySteps(rpsRecord);
    expect(steps).toHaveLength(3); // initial + 2 moves
    expect(steps[0].move).toBeNull();
    expect(steps[1].move).toEqual(rpsRecord.moves[0]);
    expect(steps[2].move).toEqual(rpsRecord.moves[1]);
  });

  it('step indices are sequential starting at 0', () => {
    const steps = buildReplaySteps(rpsRecord);
    steps.forEach((step, i) => expect(step.stepIndex).toBe(i));
  });

  it('each step renders cumulative state, not just the latest move', () => {
    const steps = buildReplaySteps(rpsRecord);
    // Step 2 (after both moves) should mention both players' choices.
    expect(steps[2].render).toContain('GALICE');
    expect(steps[2].render).toContain('GBOB');
    expect(steps[2].render).toContain('rock');
    expect(steps[2].render).toContain('scissors');
  });

  it('is deterministic: the same record always produces the same steps', () => {
    const stepsA = buildReplaySteps(rpsRecord);
    const stepsB = buildReplaySteps(rpsRecord);
    expect(stepsA.map((s) => s.render)).toEqual(stepsB.map((s) => s.render));
  });

  it('handles a match with zero moves (only the initial state)', () => {
    const empty: MatchRecord = { ...rpsRecord, moves: [] };
    const steps = buildReplaySteps(empty);
    expect(steps).toHaveLength(1);
    expect(steps[0].move).toBeNull();
  });

  it('renders the dice game type', () => {
    const diceRecord: MatchRecord = {
      matchId: 'm2',
      gameType: 'dice',
      players: ['GALICE'],
      wagerXlm: 5,
      moves: [{ moveIndex: 0, player: 'GALICE', timestamp: 't0', data: { value: 6 } }],
    };
    const steps = buildReplaySteps(diceRecord);
    expect(steps[1].render).toContain('GALICE');
    expect(steps[1].render).toContain('6');
  });

  it('renders the matrix game type, revealing cells progressively', () => {
    const matrixRecord: MatchRecord = {
      matchId: 'm3',
      gameType: 'matrix',
      players: ['GALICE'],
      wagerXlm: 0,
      moves: [
        { moveIndex: 0, player: 'GALICE', timestamp: 't0', data: { gridSize: 3, cell: 0 } },
        { moveIndex: 1, player: 'GALICE', timestamp: 't1', data: { cell: 4 } },
      ],
    };
    const steps = buildReplaySteps(matrixRecord);
    const finalRender = steps[steps.length - 1].render;
    const revealedCount = (finalRender.match(/■/g) ?? []).length;
    expect(revealedCount).toBe(2);
  });

  it('renders the trivia game type', () => {
    const triviaRecord: MatchRecord = {
      matchId: 'm4',
      gameType: 'trivia',
      players: ['GALICE'],
      wagerXlm: 0,
      moves: [
        { moveIndex: 0, player: 'GALICE', timestamp: 't0', data: { roundIdx: 1, revealed: false } },
      ],
    };
    const steps = buildReplaySteps(triviaRecord);
    expect(steps[1].render).toContain('round 1');
    expect(steps[1].render).toContain('committed');
  });
});
