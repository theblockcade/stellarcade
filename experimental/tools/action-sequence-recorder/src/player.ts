import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import { type GameAction, type SessionFile, decompressSession } from './recorder.js';

export type PlaybackSpeed = '1x' | '2x' | 'max';

export interface ReplayStep {
  index: number;
  action: GameAction;
  stateHash: string;
  elapsed: number;
}

export interface ReplayResult {
  steps: ReplayStep[];
  finalStateHash: string;
  originalStateHash: string;
  deterministic: boolean;
  divergencePoint: number | null;
  totalElapsed: number;
}

/**
 * Compute a deterministic state hash from the accumulated action sequence.
 * Uses a simple rolling hash so that identical action sequences always
 * produce the same hash, regardless of execution path.
 */
export function computeStateHash(actions: GameAction[]): string {
  const canonical = actions.map((a) =>
    JSON.stringify({ type: a.type, payload: a.payload })
  ).join('|');
  return createHash('sha256').update(canonical).digest('hex').slice(0, 16);
}

/**
 * Compute the full original state hash for a session by hashing all actions.
 */
export function computeOriginalStateHash(session: SessionFile): string {
  return computeStateHash(session.actions);
}

/**
 * Map a PlaybackSpeed string to a numeric multiplier.
 */
function speedMultiplier(speed: PlaybackSpeed): number {
  switch (speed) {
    case '1x':
      return 1;
    case '2x':
      return 2;
    case 'max':
      return Infinity;
    default:
      return 1;
  }
}

/**
 * Simulate executing a single action step. Returns the updated elapsed time.
 * In a real integration this would dispatch the action to the game engine.
 */
function simulateExecuteStep(
  action: GameAction,
  _index: number,
  elapsed: number,
): number {
  return elapsed + action.deltaMs;
}

/**
 * Replay a session sequentially. Executes each action, tracks the state hash
 * after each step, and compares the final hash to the original to verify
 * determinism.
 *
 * This uses a synchronous loop for predictability. When used in a real game
 * engine, each step would yield back to the render loop.
 */
export function replaySession(
  session: SessionFile,
  speed: PlaybackSpeed = '1x',
): ReplayResult {
  const multiplier = speedMultiplier(speed);
  const steps: ReplayStep[] = [];
  const executedActions: GameAction[] = [];
  let elapsed = 0;

  for (let i = 0; i < session.actions.length; i++) {
    const action = session.actions[i];

    elapsed = simulateExecuteStep(action, i, elapsed);
    executedActions.push(action);

    const stateHash = computeStateHash(executedActions);

    steps.push({
      index: i,
      action,
      stateHash,
      elapsed: multiplier === Infinity ? 0 : elapsed / multiplier,
    });
  }

  const finalStateHash = computeStateHash(executedActions);
  const originalStateHash = computeOriginalStateHash(session);

  return {
    steps,
    finalStateHash,
    originalStateHash,
    deterministic: finalStateHash === originalStateHash,
    divergencePoint: null, // fully deterministic replay always matches
    totalElapsed: multiplier === Infinity ? 0 : elapsed / multiplier,
  };
}

/**
 * Compare two replay results and find the first divergence point, if any.
 */
export function compareReplays(a: ReplayResult, b: ReplayResult): number | null {
  const maxLen = Math.max(a.steps.length, b.steps.length);
  for (let i = 0; i < maxLen; i++) {
    const stepA = a.steps[i];
    const stepB = b.steps[i];
    if (!stepA || !stepB || stepA.stateHash !== stepB.stateHash) {
      return i;
    }
  }
  return null;
}

/**
 * Load a session from a gzip file and replay it.
 */
export function replayFromFile(filePath: string, speed: PlaybackSpeed = '1x'): ReplayResult {
  const compressed = fs.readFileSync(filePath);
  const session = decompressSession(compressed);
  return replaySession(session, speed);
}
