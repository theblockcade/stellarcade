/**
 * Shared contract types and result envelope for the Soroban Contract Client.
 */

import type { SorobanClientError } from "./errors";

export type ContractResult<T> =
  | {
      success: true;
      data: T;
      txHash?: string;
      ledger?: number;
    }
  | {
      success: false;
      error: SorobanClientError;
    };

export interface CallOptions {
  fee?: number;
  timeoutSecs?: number;
  retries?: number;
  idempotencyKey?: string;
}

export interface WalletProvider {
  isConnected(): Promise<boolean>;
  getPublicKey(): Promise<string>;
  getNetwork(): Promise<{ network: string; networkPassphrase: string }>;
  signTransaction(
    xdr: string,
    opts?: { network?: string; networkPassphrase?: string }
  ): Promise<string>;
}

export interface DefineBadgeParams {
  badgeId: bigint;
  criteriaHash: string;
  reward: bigint;
}

export interface BadgeDefinition {
  criteriaHash: string;
  reward: bigint;
}

export interface PoolState {
  available: bigint;
  reserved: bigint;
}

export enum ContractRole {
  Admin = "ADMIN",
  Operator = "OPERATOR",
  Pauser = "PAUSER",
  Game = "GAME",
}
