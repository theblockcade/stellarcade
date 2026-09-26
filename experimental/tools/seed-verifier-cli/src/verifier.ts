import * as crypto from 'crypto';
import type {
  BatchLogEntry,
  BatchVerificationResult,
  GameKind,
  RoundInput,
  RoundOutcome,
  VerificationResult,
} from '../types';

/** SHA-256 hex digest of a server seed, used as its public commitment. */
export function computeCommitment(serverSeed: string): string {
  return crypto.createHash('sha256').update(serverSeed, 'utf8').digest('hex');
}

/** HMAC-SHA256(serverSeed, `${clientSeed}:${nonce}`) — the deterministic round hash. */
export function computeRoundHash(serverSeed: string, clientSeed: string, nonce: number): string {
  return crypto
    .createHmac('sha256', serverSeed)
    .update(`${clientSeed}:${nonce}`, 'utf8')
    .digest('hex');
}

/** First 8 hex chars of the round hash interpreted as an unsigned 32-bit integer. */
export function hashToRawValue(hash: string): number {
  return parseInt(hash.slice(0, 8), 16);
}

/** Map a raw value to a game-specific outcome. */
export function mapOutcome(game: GameKind, rawValue: number): string | number {
  switch (game) {
    case 'coinflip':
      return rawValue % 2 === 0 ? 'heads' : 'tails';
    case 'dice':
      return (rawValue % 100) + 1;
    case 'roulette':
      return rawValue % 37;
    default: {
      const exhaustive: never = game;
      throw new Error(`Unsupported game: ${exhaustive as string}`);
    }
  }
}

/** Recompute the full deterministic outcome for a round from its raw seed parameters. */
export function computeRoundOutcome(input: RoundInput): RoundOutcome {
  const hash = computeRoundHash(input.serverSeed, input.clientSeed, input.nonce);
  const rawValue = hashToRawValue(hash);
  return {
    game: input.game,
    hash,
    rawValue,
    result: mapOutcome(input.game, rawValue),
  };
}

/** Verify a single round: recomputes the outcome and, if given, checks the seed commitment. */
export function verifyRound(input: RoundInput, expectedResult?: string | number): VerificationResult {
  const reasons: string[] = [];
  const outcome = computeRoundOutcome(input);

  let commitmentValid: boolean | null = null;
  if (input.commitment) {
    commitmentValid = computeCommitment(input.serverSeed) === input.commitment.toLowerCase();
    if (!commitmentValid) {
      reasons.push('Server seed does not match provided commitment hash');
    }
  }

  if (expectedResult !== undefined && String(expectedResult) !== String(outcome.result)) {
    reasons.push(
      `Recomputed result (${outcome.result}) does not match expected result (${expectedResult})`
    );
  }

  const passed = reasons.length === 0;

  return {
    input,
    outcome,
    commitmentValid,
    passed,
    reasons,
  };
}

/** Verify a batch of rounds parsed from a JSON log file (array of BatchLogEntry). */
export function verifyBatch(entries: BatchLogEntry[]): BatchVerificationResult {
  const results = entries.map((entry) => verifyRound(entry, entry.expectedResult));
  const passed = results.filter((r) => r.passed).length;
  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    results,
  };
}

const RESET = '\u001b[0m';
const GREEN = '\u001b[32m';
const RED = '\u001b[31m';

function colorize(text: string, ok: boolean): string {
  return `${ok ? GREEN : RED}${text}${RESET}`;
}

export function formatVerification(result: VerificationResult): string {
  const lines: string[] = [];
  lines.push(`Game:        ${result.input.game}`);
  lines.push(`Server seed: ${result.input.serverSeed}`);
  lines.push(`Client seed: ${result.input.clientSeed}`);
  lines.push(`Nonce:       ${result.input.nonce}`);
  lines.push(`Hash:        ${result.outcome.hash}`);
  lines.push(`Result:      ${result.outcome.result}`);
  if (result.commitmentValid !== null) {
    lines.push(`Commitment:  ${colorize(result.commitmentValid ? 'MATCH' : 'MISMATCH', result.commitmentValid)}`);
  }
  lines.push(`Status:      ${colorize(result.passed ? 'PASS' : 'FAIL', result.passed)}`);
  if (result.reasons.length > 0) {
    for (const reason of result.reasons) {
      lines.push(`  - ${reason}`);
    }
  }
  return lines.join('\n');
}

export function formatBatchSummary(batch: BatchVerificationResult): string {
  const lines: string[] = [];
  lines.push(`Verified ${batch.total} round(s): ${colorize(String(batch.passed), true)} passed, ${colorize(String(batch.failed), batch.failed === 0)} failed`);
  batch.results.forEach((r, i) => {
    const status = colorize(r.passed ? 'PASS' : 'FAIL', r.passed);
    lines.push(`  [${i}] ${r.input.game} nonce=${r.input.nonce} -> ${r.outcome.result} ${status}`);
  });
  return lines.join('\n');
}
