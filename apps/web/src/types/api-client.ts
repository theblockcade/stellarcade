/**
 * Typed request/response contracts for the StellarCade backend REST API.
 *
 * All public endpoints are represented here as plain TypeScript interfaces.
 * The `ApiResult<T>` discriminated union is the canonical return type for
 * every `ApiClient` method — callers never need a try/catch.
 *
 * @module types/api-client
 */

import type { AppError } from './errors';

// ── Result envelope ─────────────────────────────────────────────────────────

/**
 * Discriminated union returned by every `ApiClient` method.
 * Mirrors the `ContractResult<T>` pattern used in `types/contracts.ts`.
 *
 * @example
 * ```typescript
 * const result = await client.getGames();
 * if (result.success) {
 *   console.log(result.data); // Game[]
 * } else {
 *   console.error(result.error.code); // ApiErrorCode
 * }
 * ```
 */
export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: ApiClientError };

export const ApiErrorCategory = {
  VALIDATION: 'validation',
  NETWORK: 'network',
  AUTH: 'auth',
  SERVER: 'server',
  UNKNOWN: 'unknown',
} as const;

export type ApiErrorCategory =
  (typeof ApiErrorCategory)[keyof typeof ApiErrorCategory];

export interface ApiClientError extends AppError {
  category: ApiErrorCategory;
  status?: number;
  originalMessage?: string;
  /**
   * Machine-readable hint from the handler (e.g. `PROFILE_NOT_FOUND`,
   * `PROFILE_EXISTS`). Lets a caller distinguish conflicts that need
   * different recovery without string-matching the human message.
   */
  serverCode?: string;
}

/**
 * Options for a single API request.
 */
export interface ApiRequestOptions {
  /**
   * Optional AbortSignal to cancel the request.
   */
  signal?: AbortSignal;
  /**
   * Optional timeout in milliseconds.
   */
  timeout?: number;
}

// ── GET /api/games ───────────────────────────────────────────────────────────

/** A single game entry returned by the backend. */
export interface Game {
  id: string;
  name: string;
  status: string;
  [key: string]: unknown;
}

/** Response shape for `GET /api/games`. */
export type GetGamesResponse = Game[];

/** Response shape for `GET /api/games/:gameId`. */
export type GetGameByIdResponse = Game | null;

// ── POST /api/games/play ─────────────────────────────────────────────────────

/** Request body for `POST /api/games/play`. Requires auth. */
export interface PlayGameRequest {
  /** ID of the game to play. Must be a non-empty string. */
  gameId: string;
  /** Optional wager amount in XLM. Must be positive if provided. */
  wager?: number;
}

/** Response shape for `POST /api/games/play`. */
export interface PlayGameResponse {
  result: string;
  payout?: number;
  txHash?: string;
}

// ── GET /api/users/profile ───────────────────────────────────────────────────

/** A user's on-chain profile. */
export interface UserProfile {
  address: string;
  username?: string;
  telegramHandle?: string;
  telegramUserId?: string;
  telegramLinked?: boolean;
  createdAt: string;
  updatedAt?: string;
  /**
   * ISO timestamp of the player's 18-or-over confirmation. Absent means the
   * player has not confirmed yet — treat that as "not onboarded", never as
   * an implicit yes.
   */
  ageConfirmedAt?: string;
}

/** Response shape for `GET /api/users/profile`. */
export type GetProfileResponse = UserProfile;

// ── POST /api/users/create ───────────────────────────────────────────────────

/** Request body for `POST /api/users/create`. */
export interface CreateProfileRequest {
  /** Stellar public key (G…). Must be a non-empty string. */
  address: string;
  username?: string;
  /**
   * The player ticked "I am 18 or over". The server records the timestamp;
   * it will reject creation without it.
   */
  ageConfirmed?: boolean;
}

/** Response shape for `POST /api/users/create`. */
export type CreateProfileResponse = UserProfile;

export interface UpdateProfileRequest {
  address: string;
  username: string;
  /** Telegram bot linking — accepted by POST /api/users/update, which sets
   *  telegramLinked itself when a telegramUserId is supplied. */
  telegramHandle?: string;
  telegramUserId?: string;
  /**
   * Records the 18-or-over confirmation on a profile that predates the age
   * gate. The server only ever sets it, never clears it.
   */
  ageConfirmed?: boolean;
}

export type UpdateProfileResponse = UserProfile;

// ── POST /api/wallet/deposit & /api/wallet/withdraw ─────────────────────────

/** Request body for deposit/withdraw endpoints. Requires auth. */
export interface WalletAmountRequest {
  /** Amount in XLM. Must be greater than zero. */
  amount: number;
}

/** Response shape for wallet operations. */
export interface WalletOpResponse {
  balance: number;
  txHash?: string;
}

/** Response shape for `POST /api/wallet/deposit`. */
export type DepositResponse = WalletOpResponse;

/** Response shape for `POST /api/wallet/withdraw`. */
export type WithdrawResponse = WalletOpResponse;
