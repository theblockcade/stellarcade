export type GameKind = 'coinflip' | 'dice' | 'roulette';

export interface RoundInput {
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  game: GameKind;
  commitment?: string;
}

export interface RoundOutcome {
  game: GameKind;
  hash: string;
  /** Raw numeric outcome derived from the hash, before game-specific mapping. */
  rawValue: number;
  /** Human readable result, e.g. 'heads', 'tails', 42, 17. */
  result: string | number;
}

export interface VerificationResult {
  input: Omit<RoundInput, 'serverSeed'> & { serverSeed: string };
  outcome: RoundOutcome;
  commitmentValid: boolean | null;
  passed: boolean;
  reasons: string[];
}

export interface BatchLogEntry extends RoundInput {
  /** Expected result recorded at play time, to be checked against recomputed outcome. */
  expectedResult?: string | number;
}

export interface BatchVerificationResult {
  total: number;
  passed: number;
  failed: number;
  results: VerificationResult[];
}
