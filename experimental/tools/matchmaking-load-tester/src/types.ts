export interface LoadTestConfig {
  players: number;
  durationSec: number;
  apiUrl: string;
  gameType: string;
  concurrency: number;
  matchAcceptTimeoutMs?: number;
  heartbeatIntervalMs?: number;
}

export type PlayerState =
  | 'idle'
  | 'connecting'
  | 'queued'
  | 'match_found'
  | 'match_accepted'
  | 'in_match'
  | 'completed'
  | 'timed_out'
  | 'disconnected'
  | 'errored';

export interface MetricSample {
  playerId: string;
  queueWaitMs?: number;
  pairingLatencyMs?: number;
  outcome: 'completed' | 'timeout' | 'disconnect' | 'error';
}

export interface PercentileStats {
  count: number;
  min: number;
  max: number;
  mean: number;
  p50: number;
  p95: number;
  p99: number;
}

export interface LoadTestSummary {
  totalPlayers: number;
  completedMatches: number;
  timeouts: number;
  disconnects: number;
  errors: number;
  timeoutRate: number;
  errorRate: number;
  totalOutcomes: number;
  durationMs: number;
  queueWaitMs: PercentileStats;
  pairingLatencyMs: PercentileStats;
}

export interface VirtualPlayerOptions {
  id: string;
  apiUrl: string;
  gameType: string;
  matchAcceptTimeoutMs: number;
  heartbeatIntervalMs: number;
}

export interface VirtualPlayerResult {
  playerId: string;
  finalState: PlayerState;
  queueWaitMs?: number;
  pairingLatencyMs?: number;
  outcome: MetricSample['outcome'];
}
