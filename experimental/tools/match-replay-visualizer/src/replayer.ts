import type { MatchMove, MatchRecord, ReplayStep, SupportedGameType } from './types';

export class MatchNotFoundError extends Error {
  constructor(matchId: string) {
    super(`Match not found: ${matchId}`);
    this.name = 'MatchNotFoundError';
  }
}

export class UnsupportedGameTypeError extends Error {
  constructor(gameType: string) {
    super(`Unsupported game type for replay rendering: ${gameType}`);
    this.name = 'UnsupportedGameTypeError';
  }
}

const SUPPORTED_GAME_TYPES: SupportedGameType[] = [
  'rock-paper-scissors',
  'dice',
  'matrix',
  'trivia',
];

/**
 * Parses a raw match history payload (as returned by a Soroban RPC event
 * query or transaction-history lookup) into a `MatchRecord`.
 *
 * Handles corrupt or incomplete data defensively: missing/malformed fields
 * produce a `MatchRecord` with an empty `moves` array and a warning is left
 * for the caller to surface, rather than throwing — a single bad move
 * should not make the whole match unreplayable.
 */
export function parseMatchHistory(raw: unknown): { record: MatchRecord; warnings: string[] } {
  const warnings: string[] = [];

  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Match history payload must be an object');
  }
  const obj = raw as Record<string, unknown>;

  const matchId = typeof obj.matchId === 'string' ? obj.matchId : 'unknown';
  const gameType = SUPPORTED_GAME_TYPES.includes(obj.gameType as SupportedGameType)
    ? (obj.gameType as SupportedGameType)
    : null;
  if (!gameType) {
    throw new UnsupportedGameTypeError(String(obj.gameType));
  }

  const players = Array.isArray(obj.players)
    ? obj.players.filter((p): p is string => typeof p === 'string')
    : [];
  if (players.length === 0) {
    warnings.push('No valid players found in match record');
  }

  const wagerXlm = typeof obj.wagerXlm === 'number' && Number.isFinite(obj.wagerXlm)
    ? obj.wagerXlm
    : 0;

  const rawMoves = Array.isArray(obj.moves) ? obj.moves : [];
  const moves: MatchMove[] = [];
  rawMoves.forEach((rawMove, index) => {
    if (typeof rawMove !== 'object' || rawMove === null) {
      warnings.push(`Skipping corrupt move at index ${index}: not an object`);
      return;
    }
    const m = rawMove as Record<string, unknown>;
    if (typeof m.player !== 'string' || typeof m.data !== 'object' || m.data === null) {
      warnings.push(`Skipping incomplete move at index ${index}: missing player or data`);
      return;
    }
    moves.push({
      moveIndex: moves.length,
      player: m.player,
      timestamp: typeof m.timestamp === 'string' ? m.timestamp : new Date(0).toISOString(),
      data: m.data as Record<string, unknown>,
    });
  });

  let outcome: MatchRecord['outcome'];
  if (typeof obj.outcome === 'object' && obj.outcome !== null) {
    const o = obj.outcome as Record<string, unknown>;
    if (typeof o.winner === 'string' && typeof o.settledAt === 'string') {
      outcome = { winner: o.winner, settledAt: o.settledAt };
    } else {
      warnings.push('Outcome present but malformed — treating match as unfinalized');
    }
  }

  return {
    record: { matchId, gameType, players, wagerXlm, moves, outcome },
    warnings,
  };
}

/**
 * Deterministic step state machine: `initial -> move 1 -> move 2 -> ... ->
 * settled`. `buildReplaySteps(record)[i]` is always the same value for the
 * same record — replay is a pure function of the move log, never dependent
 * on wall-clock time or external state.
 */
export function buildReplaySteps(record: MatchRecord): ReplayStep[] {
  const steps: ReplayStep[] = [
    { stepIndex: 0, move: null, render: renderInitialState(record) },
  ];

  for (const move of record.moves) {
    steps.push({
      stepIndex: steps.length,
      move,
      render: renderMoveState(record, steps.slice(1).map((s) => s.move!).concat(move)),
    });
  }

  return steps;
}

function renderInitialState(record: MatchRecord): string {
  switch (record.gameType) {
    case 'rock-paper-scissors':
      return `[ ? ]  vs  [ ? ]\n${record.players.join(' vs ')}`;
    case 'dice':
      return '🎲 Waiting for roll...';
    case 'matrix': {
      const size = inferGridSize(record);
      return renderEmptyGrid(size);
    }
    case 'trivia':
      return 'Waiting for question round...';
    default:
      throw new UnsupportedGameTypeError(record.gameType);
  }
}

function renderMoveState(record: MatchRecord, movesSoFar: MatchMove[]): string {
  const latest = movesSoFar[movesSoFar.length - 1];
  switch (record.gameType) {
    case 'rock-paper-scissors':
      return renderRpsState(movesSoFar);
    case 'dice':
      return renderDiceState(latest);
    case 'matrix':
      return renderMatrixState(record, movesSoFar);
    case 'trivia':
      return renderTriviaState(latest);
    default:
      throw new UnsupportedGameTypeError(record.gameType);
  }
}

const RPS_SYMBOLS: Record<string, string> = {
  rock: '✊',
  paper: '✋',
  scissors: '✌️',
};

function renderRpsState(moves: MatchMove[]): string {
  const lines = moves.map((m) => {
    const choice = typeof m.data.choice === 'string' ? m.data.choice : '?';
    const symbol = RPS_SYMBOLS[choice] ?? '?';
    return `${m.player}: ${symbol} (${choice})`;
  });
  return lines.join('\n');
}

function renderDiceState(move: MatchMove | undefined): string {
  if (!move) {
    return '🎲 Waiting for roll...';
  }
  const value = typeof move.data.value === 'number' ? move.data.value : '?';
  const pips = typeof value === 'number' ? '⚀⚁⚂⚃⚄⚅'[value - 1] ?? '🎲' : '🎲';
  return `${move.player} rolled ${pips} (${value})`;
}

function inferGridSize(record: MatchRecord): number {
  const first = record.moves[0];
  const size = first && typeof first.data.gridSize === 'number' ? first.data.gridSize : 4;
  return size > 0 ? size : 4;
}

function renderEmptyGrid(size: number): string {
  const row = Array(size).fill('·').join(' ');
  return Array(size).fill(row).join('\n');
}

function renderMatrixState(record: MatchRecord, moves: MatchMove[]): string {
  const size = inferGridSize(record);
  const revealed = new Set<number>();
  for (const move of moves) {
    if (typeof move.data.cell === 'number') {
      revealed.add(move.data.cell);
    }
  }
  const rows: string[] = [];
  for (let r = 0; r < size; r++) {
    const cells: string[] = [];
    for (let c = 0; c < size; c++) {
      const index = r * size + c;
      cells.push(revealed.has(index) ? '■' : '·');
    }
    rows.push(cells.join(' '));
  }
  return rows.join('\n');
}

function renderTriviaState(move: MatchMove | undefined): string {
  if (!move) {
    return 'Waiting for question round...';
  }
  const round = typeof move.data.roundIdx === 'number' ? move.data.roundIdx : '?';
  const revealed = move.data.revealed === true;
  return `${move.player} — round ${round}: ${revealed ? 'revealed' : 'committed'}`;
}

/** Look up a match by id in a pre-fetched collection (test/CLI seam). */
export function findMatch(matches: MatchRecord[], matchId: string): MatchRecord {
  const found = matches.find((m) => m.matchId === matchId);
  if (!found) {
    throw new MatchNotFoundError(matchId);
  }
  return found;
}
