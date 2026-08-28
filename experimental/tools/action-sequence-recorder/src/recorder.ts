import * as zlib from 'node:zlib';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface GameAction {
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
  deltaMs: number;
}

export interface SessionFile {
  gameId: string;
  recordedAt: string;
  actions: GameAction[];
  metadata: Record<string, unknown>;
}

const MOCK_ACTION_TYPES = [
  'move_left',
  'move_right',
  'jump',
  'fire',
  'pause',
  'resume',
  'select_powerup',
  'collect_coin',
  'dodge_obstacle',
  'use_ability',
];

const MOCK_PAYLOADS: Record<string, Record<string, unknown>> = {
  move_left: { direction: 'left', distance: 1 },
  move_right: { direction: 'right', distance: 1 },
  jump: { height: 3, duration: 200 },
  fire: { weapon: 'laser', ammo: 1 },
  pause: {},
  resume: {},
  select_powerup: { powerupId: 'shield', slot: 0 },
  collect_coin: { coinId: 'c-001', value: 10 },
  dodge_obstacle: { obstacleId: 'obs-042', direction: 'up' },
  use_ability: { ability: 'dash', cooldownMs: 1500 },
};

/**
 * Generate mock actions for experimental testing.
 * Produces a realistic-looking sequence of arcade actions with
 * plausible timing deltas between them.
 */
export function generateMockActions(count: number): GameAction[] {
  const actions: GameAction[] = [];
  let baseTimestamp = Date.now();

  for (let i = 0; i < count; i++) {
    const typeIndex = Math.floor(Math.random() * MOCK_ACTION_TYPES.length);
    const type = MOCK_ACTION_TYPES[typeIndex];
    const deltaMs = Math.floor(Math.random() * 500) + 16; // 16-516ms between actions
    baseTimestamp += deltaMs;

    actions.push({
      type,
      payload: { ...MOCK_PAYLOADS[type] },
      timestamp: baseTimestamp,
      deltaMs,
    });
  }

  return actions;
}

/**
 * Create a session file from raw actions.
 */
export function createSession(
  gameId: string,
  actions: GameAction[],
  metadata: Record<string, unknown> = {}
): SessionFile {
  return {
    gameId,
    recordedAt: new Date().toISOString(),
    actions,
    metadata: {
      actionCount: actions.length,
      totalDurationMs: actions.reduce((sum, a) => sum + a.deltaMs, 0),
      ...metadata,
    },
  };
}

/**
 * Compress a session file to gzipped JSON bytes.
 */
export function compressSession(session: SessionFile): Buffer {
  const json = JSON.stringify(session, null, 2);
  return zlib.gzipSync(Buffer.from(json, 'utf-8'));
}

/**
 * Decompress gzipped session bytes back to a SessionFile.
 */
export function decompressSession(compressed: Buffer): SessionFile {
  const json = zlib.gunzipSync(compressed).toString('utf-8');
  return JSON.parse(json) as SessionFile;
}

/**
 * Save a session file to disk as gzip-compressed JSON.
 */
export function saveSessionToFile(session: SessionFile, filePath: string): void {
  const compressed = compressSession(session);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, compressed);
}

/**
 * Load a session file from a gzip-compressed JSON file.
 */
export function loadSessionFromFile(filePath: string): SessionFile {
  const compressed = fs.readFileSync(filePath);
  return decompressSession(compressed);
}
