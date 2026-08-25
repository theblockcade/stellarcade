import { describe, it, expect } from 'vitest';
import { ReplayCursor, renderFrame } from './ui';
import { buildReplaySteps } from './replayer';
import type { MatchRecord, ReplayStep } from './types';

const record: MatchRecord = {
  matchId: 'm1',
  gameType: 'dice',
  players: ['GALICE', 'GBOB'],
  wagerXlm: 25,
  moves: [
    { moveIndex: 0, player: 'GALICE', timestamp: 't0', data: { value: 3 } },
    { moveIndex: 1, player: 'GBOB', timestamp: 't1', data: { value: 5 } },
  ],
  outcome: { winner: 'GBOB', settledAt: 't2' },
};

describe('ReplayCursor', () => {
  it('starts at index 0 (initial state)', () => {
    const cursor = new ReplayCursor(buildReplaySteps(record));
    expect(cursor.currentIndex).toBe(0);
    expect(cursor.isAtStart).toBe(true);
    expect(cursor.current.move).toBeNull();
  });

  it('next() advances one step at a time', () => {
    const cursor = new ReplayCursor(buildReplaySteps(record));
    cursor.next();
    expect(cursor.currentIndex).toBe(1);
    expect(cursor.current.move?.player).toBe('GALICE');
    cursor.next();
    expect(cursor.currentIndex).toBe(2);
    expect(cursor.current.move?.player).toBe('GBOB');
  });

  it('next() does not advance past the last step', () => {
    const cursor = new ReplayCursor(buildReplaySteps(record));
    cursor.jumpToEnd();
    expect(cursor.isAtEnd).toBe(true);
    cursor.next();
    expect(cursor.isAtEnd).toBe(true);
    expect(cursor.currentIndex).toBe(2);
  });

  it('previous() retreats one step and does not go below 0', () => {
    const cursor = new ReplayCursor(buildReplaySteps(record));
    cursor.jumpToEnd();
    cursor.previous();
    expect(cursor.currentIndex).toBe(1);
    cursor.previous();
    cursor.previous();
    cursor.previous();
    expect(cursor.currentIndex).toBe(0);
    expect(cursor.isAtStart).toBe(true);
  });

  it('jumpToEnd() jumps directly to the last step', () => {
    const cursor = new ReplayCursor(buildReplaySteps(record));
    cursor.jumpToEnd();
    expect(cursor.currentIndex).toBe(cursor.lastIndex);
    expect(cursor.current.move?.player).toBe('GBOB');
  });

  it('jumpToStart() resets to the initial state from anywhere', () => {
    const cursor = new ReplayCursor(buildReplaySteps(record));
    cursor.jumpToEnd();
    cursor.jumpToStart();
    expect(cursor.currentIndex).toBe(0);
    expect(cursor.current.move).toBeNull();
  });

  it('throws when constructed with an empty steps array', () => {
    expect(() => new ReplayCursor([])).toThrow();
  });

  it('full traversal: initial -> move 1 -> move 2 -> settled matches record order', () => {
    const cursor = new ReplayCursor(buildReplaySteps(record));
    const visited: (string | null)[] = [cursor.current.move?.player ?? null];
    while (!cursor.isAtEnd) {
      cursor.next();
      visited.push(cursor.current.move?.player ?? null);
    }
    expect(visited).toEqual([null, 'GALICE', 'GBOB']);
  });
});

describe('renderFrame', () => {
  it('includes match id, players, and the current step render', () => {
    const cursor = new ReplayCursor(buildReplaySteps(record));
    cursor.next();
    const frame = renderFrame(record, cursor);

    expect(frame).toContain('m1');
    expect(frame).toContain('GALICE');
    expect(frame).toContain('GBOB');
    expect(frame).toContain('Step 1/2');
  });

  it('shows the winner once the cursor reaches the final settled step', () => {
    const cursor = new ReplayCursor(buildReplaySteps(record));
    cursor.jumpToEnd();
    const frame = renderFrame(record, cursor);
    expect(frame).toContain('Winner: GBOB');
  });

  it('shows an unfinalized notice at the end step when there is no outcome', () => {
    const unfinalized: MatchRecord = { ...record, outcome: undefined };
    const cursor = new ReplayCursor(buildReplaySteps(unfinalized));
    cursor.jumpToEnd();
    const frame = renderFrame(unfinalized, cursor);
    expect(frame).toContain('not yet finalized');
  });

  it('does not show winner/outcome text before reaching the end step', () => {
    const cursor = new ReplayCursor(buildReplaySteps(record));
    const frame = renderFrame(record, cursor);
    expect(frame).not.toContain('Winner:');
  });
});
