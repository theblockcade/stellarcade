/**
 * Input Validation Schemas for Game Operations
 *
 * Production-grade validation schemas for all Stellarcade game operations.
 * Each schema validates one logical unit of user input and returns a typed
 * discriminated union — callers never need a try/catch.
 *
 * @module services/input-validation-schemas
 */

import {
  validateWager,
  validateGameId,
  validateBadgeId,
  validateStellarAddress,
  validateContractAddress,
  validateSha256Hash,
  validateEnum,
  validateString,
  validateNumber,
  isDefined,
  isNonEmptyString,
  isPositiveBigInt,
  isNonNegativeBigInt,
  isWalletConnected,
} from '../utils/v1/validation';

// Type-only imports to avoid TS6133 "never read" errors
import type {
  ValidationErrorCode,
  ValidationResult,
  ValidationError,
  WagerBounds,
} from '../utils/v1/validation';

// Re-export primitives and types
export {
  validateWager,
  validateGameId,
  validateBadgeId,
  validateStellarAddress,
  validateContractAddress,
  validateSha256Hash,
  validateEnum,
  validateString,
  validateNumber,
  isDefined,
  isNonEmptyString,
  isPositiveBigInt,
  isNonNegativeBigInt,
  isWalletConnected,
};

export type { ValidationErrorCode, ValidationResult, ValidationError, WagerBounds };

// ── Contract-Aligned Constants ─────────────────────────────────────────────────

export const U64_MAX: bigint = 18_446_744_073_709_551_615n;

export const COIN_FLIP_SIDES = ['heads', 'tails'] as const;
export type CoinFlipSide = (typeof COIN_FLIP_SIDES)[number];

export const COIN_FLIP_SIDE_TO_U32: Record<CoinFlipSide, number> = {
  heads: 0,
  tails: 1,
};

export const COIN_FLIP_WAGER_BOUNDS: Readonly<WagerBounds> = Object.freeze({
  min: 10_000_000n,
  max: 10_000_000_000n,
});

export const PRIZE_POOL_AMOUNT_BOUNDS: Readonly<WagerBounds> = Object.freeze({
  min: 10_000_000n,
  max: 10_000_000_000n,
});

export const PUZZLE_ENTRY_FEE_BOUNDS: Readonly<WagerBounds> = Object.freeze({
  min: 0n,
  max: 10_000_000_000n,
});

export const PUZZLE_SOLUTION_MAX_BYTES = 1024;
export const MAX_PLAYERS_PER_ROUND = 500;

// ── Validation Functions & Compound Schemas ───────────────────────────────────
// (The rest of your file remains the same: validateRoundId, parseCoinFlipBet, parsePatternSubmission, parseCreatePuzzleRound, etc.)