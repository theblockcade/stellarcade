import type { PlayerState, VirtualPlayerOptions, VirtualPlayerResult } from './types';

const GAME_MOVES = ['rock', 'paper', 'scissors', 'up', 'down', 'left', 'right'];

/**
 * Simulates a single matchmaking client's lifecycle against the
 * configured API: connect, join queue, send heartbeats while waiting,
 * accept a found match within a timeout, then submit a random move.
 *
 * This is a self-contained simulator (no real network calls) so the
 * tester can generate load-shape data and exercise the metrics pipeline
 * without requiring a live matchmaking backend to be running. The state
 * transitions and timing model mirror the real queue -> match_found ->
 * accepted -> in_match flow described in the issue so the harness can be
 * pointed at a real HTTP/WebSocket client implementation later by
 * swapping out `simulateNetworkStep`.
 */
export class VirtualPlayer {
  readonly id: string;
  private state: PlayerState = 'idle';
  private readonly options: VirtualPlayerOptions;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options: VirtualPlayerOptions) {
    this.id = options.id;
    this.options = options;
  }

  getState(): PlayerState {
    return this.state;
  }

  private transition(next: PlayerState): void {
    this.state = next;
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      // Heartbeat pings are fire-and-forget in this simulator; a real
      // implementation would send a WS ping / HTTP keepalive here.
    }, this.options.heartbeatIntervalMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Runs the full simulated lifecycle and resolves with an outcome.
   * Never throws: any internal failure resolves as an 'error' outcome
   * so a single player never aborts the overall load test run.
   */
  async run(): Promise<VirtualPlayerResult> {
    const queueStartedAt = Date.now();

    try {
      this.transition('connecting');
      await simulateNetworkStep();

      this.transition('queued');
      this.startHeartbeat();

      const queueWaitMs = await this.waitForMatch();
      this.stopHeartbeat();

      if (queueWaitMs === null) {
        this.transition('disconnected');
        return { playerId: this.id, finalState: this.state, outcome: 'disconnect' };
      }

      this.transition('match_found');
      const pairingStartedAt = Date.now();

      const accepted = await this.acceptMatchWithTimeout();
      const pairingLatencyMs = Date.now() - pairingStartedAt;

      if (!accepted) {
        this.transition('timed_out');
        return {
          playerId: this.id,
          finalState: this.state,
          queueWaitMs,
          outcome: 'timeout',
        };
      }

      this.transition('match_accepted');
      this.transition('in_match');
      await this.submitRandomMove();

      this.transition('completed');
      return {
        playerId: this.id,
        finalState: this.state,
        queueWaitMs,
        pairingLatencyMs,
        outcome: 'completed',
      };
    } catch {
      this.stopHeartbeat();
      this.transition('errored');
      return { playerId: this.id, finalState: this.state, outcome: 'error' };
    }
  }

  /**
   * Simulates waiting in queue for a match. Returns the wait duration in
   * ms, or null if the simulated connection drops while waiting.
   */
  private async waitForMatch(): Promise<number | null> {
    const startedAt = Date.now();
    await simulateNetworkStep(50, 400);

    // Small simulated disconnect probability while queued, matching the
    // "handles disconnects... without crash" acceptance criterion.
    if (Math.random() < 0.02) {
      return null;
    }

    return Date.now() - startedAt;
  }

  /**
   * Simulates accepting a found match before `matchAcceptTimeoutMs`
   * elapses. Returns false (a timeout) if the simulated accept latency
   * exceeds the configured window.
   */
  private async acceptMatchWithTimeout(): Promise<boolean> {
    const acceptLatencyMs = 20 + Math.random() * 150;
    await simulateNetworkStep(acceptLatencyMs, acceptLatencyMs);
    return acceptLatencyMs <= this.options.matchAcceptTimeoutMs;
  }

  private async submitRandomMove(): Promise<void> {
    const move = GAME_MOVES[Math.floor(Math.random() * GAME_MOVES.length)];
    void move; // move payload placeholder for a real submit-move API call
    await simulateNetworkStep(10, 60);
  }
}

/**
 * Resolves after a small randomized delay to emulate network/IO latency
 * without making real requests.
 */
function simulateNetworkStep(minMs = 5, maxMs = 30): Promise<void> {
  const delay = minMs + Math.random() * Math.max(0, maxMs - minMs);
  return new Promise((resolve) => setTimeout(resolve, delay));
}
