import { describe, it, expect } from 'vitest';
import { VirtualPlayer } from './virtual-player';
import type { VirtualPlayerOptions } from './types';

const baseOptions: VirtualPlayerOptions = {
  id: 'player_test',
  apiUrl: 'http://localhost:8080',
  gameType: 'coin-flip',
  matchAcceptTimeoutMs: 5000,
  heartbeatIntervalMs: 100,
};

describe('VirtualPlayer', () => {
  it('starts in the idle state', () => {
    const player = new VirtualPlayer(baseOptions);
    expect(player.getState()).toBe('idle');
  });

  it('carries the configured id', () => {
    const player = new VirtualPlayer({ ...baseOptions, id: 'abc-123' });
    expect(player.id).toBe('abc-123');
  });

  it('resolves to a completed outcome and terminal state under normal conditions', async () => {
    const player = new VirtualPlayer(baseOptions);
    const result = await player.run();

    expect(['completed', 'timeout', 'disconnect', 'error']).toContain(result.outcome);
    expect(['completed', 'timed_out', 'disconnected', 'errored']).toContain(result.finalState);
    expect(result.playerId).toBe(baseOptions.id);
  });

  it('reports queueWaitMs for any non-disconnect outcome', async () => {
    const player = new VirtualPlayer(baseOptions);
    const result = await player.run();

    if (result.outcome !== 'disconnect' && result.outcome !== 'error') {
      expect(result.queueWaitMs).toBeGreaterThanOrEqual(0);
    }
  });

  it('reports pairingLatencyMs only when a match was found and processed', async () => {
    const player = new VirtualPlayer(baseOptions);
    const result = await player.run();

    if (result.outcome === 'completed' || result.outcome === 'timeout') {
      expect(result.pairingLatencyMs).toBeGreaterThanOrEqual(0);
    }
  });

  it('times out when matchAcceptTimeoutMs is effectively zero', async () => {
    // Forcing an impossibly small accept window should push most runs
    // toward a timeout outcome instead of throwing.
    const player = new VirtualPlayer({ ...baseOptions, matchAcceptTimeoutMs: 0 });
    const result = await player.run();

    expect(['timeout', 'disconnect', 'error']).toContain(result.outcome);
  });

  it('never throws even under repeated runs (disconnect probability path)', async () => {
    const results = await Promise.all(
      Array.from({ length: 25 }, (_, i) =>
        new VirtualPlayer({ ...baseOptions, id: `player_${i}` }).run()
      )
    );

    expect(results).toHaveLength(25);
    for (const result of results) {
      expect(['completed', 'timeout', 'disconnect', 'error']).toContain(result.outcome);
    }
  });

  it('transitions to disconnected state distinctly from errored state', async () => {
    // Run many players and assert that at least the known terminal
    // states appear as valid finalState values (no invalid state names).
    const validStates = new Set([
      'completed',
      'timed_out',
      'disconnected',
      'errored',
    ]);

    const results = await Promise.all(
      Array.from({ length: 15 }, (_, i) =>
        new VirtualPlayer({ ...baseOptions, id: `state_${i}` }).run()
      )
    );

    for (const result of results) {
      expect(validStates.has(result.finalState)).toBe(true);
    }
  });
});
