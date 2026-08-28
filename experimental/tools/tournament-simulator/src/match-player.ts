import type { MockPlayer } from './types';

/**
 * Generates `count` mock players with sequential ids and pseudo-random
 * Stellar-shaped addresses (uppercase hex, "G"-prefixed — not a real
 * strkey checksum, since this simulator never submits to a live network).
 *
 * Split out from `simulator.ts` so a future integration can swap this for
 * a real `registerAccount`/`fundTestAccount` implementation (e.g. against
 * Friendbot on testnet) without touching the bracket-progression logic.
 */
export function createMockPlayers(count: number, addressOf: (index: number) => string): MockPlayer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `player_${i + 1}`,
    address: addressOf(i),
  }));
}

/**
 * Deterministically decides a match winner from two scores. Exposed
 * separately so the win condition (currently "higher score wins, no
 * ties") can be swapped or unit-tested independently of the round-pairing
 * logic in `simulator.ts`.
 */
export function decideWinner(
  player1: MockPlayer,
  player2: MockPlayer,
  player1Score: number,
  player2Score: number,
): MockPlayer {
  if (player1Score === player2Score) {
    throw new Error('decideWinner requires distinct scores — ties must be re-rolled by the caller');
  }
  return player1Score > player2Score ? player1 : player2;
}
