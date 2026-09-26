import { createHash } from 'crypto';

export interface RecordedAction {
  timestampDelta: number;
  actionType: string;
  payload: unknown;
}

export interface MatchReplaySession {
  matchId: string;
  gameType: string;
  playerAddress: string;
  seedCommitment: string;
  actions: RecordedAction[];
  finalOutcomeHash: string;
}

export interface GameEngineState {
  score: number;
  nonce: number;
}

export interface GameEngine {
  initialState(seedCommitment: string): GameEngineState;
  applyAction(state: GameEngineState, actionType: string, payload: unknown): GameEngineState;
  outcomeHash(state: GameEngineState): string;
}

export function hashTransition(
  previousHash: string,
  actionType: string,
  payload: unknown,
  timestampDelta: number,
): string {
  const body = JSON.stringify({ previousHash, actionType, payload, timestampDelta });
  return createHash('sha256').update(body).digest('hex');
}

export function computeChainIntegrityHash(session: MatchReplaySession): string {
  let chain = session.seedCommitment;
  for (const action of session.actions) {
    chain = hashTransition(
      chain,
      action.actionType,
      action.payload,
      action.timestampDelta,
    );
  }
  return chain;
}

export class ActionRecorder {
  private readonly matchId: string;
  private readonly gameType: string;
  private readonly playerAddress: string;
  private readonly seedCommitment: string;
  private readonly actions: RecordedAction[] = [];
  private lastTimestamp = 0;
  private chainHash: string;

  constructor(params: {
    matchId: string;
    gameType: string;
    playerAddress: string;
    seedCommitment: string;
  }) {
    this.matchId = params.matchId;
    this.gameType = params.gameType;
    this.playerAddress = params.playerAddress;
    this.seedCommitment = params.seedCommitment;
    this.chainHash = params.seedCommitment;
  }

  recordAction(actionType: string, payload: unknown, nowMs = Date.now()): void {
    const timestampDelta = this.actions.length === 0 ? 0 : nowMs - this.lastTimestamp;
    if (this.actions.length > 0) {
      this.lastTimestamp = nowMs;
    } else {
      this.lastTimestamp = nowMs;
    }
    this.chainHash = hashTransition(this.chainHash, actionType, payload, timestampDelta);
    this.actions.push({ timestampDelta, actionType, payload });
  }

  exportSession(finalOutcomeHash?: string): MatchReplaySession {
    return {
      matchId: this.matchId,
      gameType: this.gameType,
      playerAddress: this.playerAddress,
      seedCommitment: this.seedCommitment,
      actions: [...this.actions],
      finalOutcomeHash: finalOutcomeHash ?? this.chainHash,
    };
  }
}
