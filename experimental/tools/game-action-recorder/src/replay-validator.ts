import {
  computeChainIntegrityHash,
  GameEngine,
  MatchReplaySession,
} from './recorder';

export interface ReplayValidationResult {
  valid: boolean;
  integrityHash: string;
  computedOutcomeHash: string;
  recordedOutcomeHash: string;
  diagnostics: string[];
}

export function validateReplaySession(
  session: MatchReplaySession,
  gameRulesEngine: GameEngine,
): ReplayValidationResult {
  const diagnostics: string[] = [];
  const integrityHash = computeChainIntegrityHash(session);

  if (session.actions.some((a) => a.timestampDelta < 0)) {
    diagnostics.push('Invalid negative timestampDelta in action stream');
  }

  let state = gameRulesEngine.initialState(session.seedCommitment);
  for (const action of session.actions) {
    state = gameRulesEngine.applyAction(state, action.actionType, action.payload);
  }
  const computedOutcomeHash = gameRulesEngine.outcomeHash(state);

  if (computedOutcomeHash !== session.finalOutcomeHash) {
    diagnostics.push(
      `Outcome hash mismatch: recorded=${session.finalOutcomeHash} computed=${computedOutcomeHash}`,
    );
  }

  const valid =
    diagnostics.length === 0 && computedOutcomeHash === session.finalOutcomeHash;

  return {
    valid,
    integrityHash,
    computedOutcomeHash,
    recordedOutcomeHash: session.finalOutcomeHash,
    diagnostics,
  };
}

export function formatValidationReport(result: ReplayValidationResult): string {
  const status = result.valid ? 'VALID' : 'INVALID';
  const lines = [
    `Replay validation: ${status}`,
    `  integrityHash: ${result.integrityHash}`,
    `  recordedOutcome: ${result.recordedOutcomeHash}`,
    `  computedOutcome: ${result.computedOutcomeHash}`,
  ];
  if (result.diagnostics.length) {
    lines.push('  diagnostics:');
    for (const d of result.diagnostics) {
      lines.push(`    - ${d}`);
    }
  }
  return lines.join('\n');
}

/** Minimal deterministic engine for arcade score-based replays. */
export function createScoreArcadeEngine(): GameEngine {
  return {
    initialState(seedCommitment: string) {
      return { score: 0, nonce: seedCommitment.length };
    },
    applyAction(state, actionType, payload) {
      if (actionType === 'score') {
        const delta = typeof payload === 'object' && payload && 'points' in payload
          ? Number((payload as { points: number }).points)
          : 0;
        return { ...state, score: state.score + delta };
      }
      return { ...state, nonce: state.nonce + 1 };
    },
    outcomeHash(state) {
      const { createHash } = require('crypto') as typeof import('crypto');
      return createHash('sha256')
        .update(JSON.stringify({ score: state.score, nonce: state.nonce }))
        .digest('hex');
    },
  };
}
