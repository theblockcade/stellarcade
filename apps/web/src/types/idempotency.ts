/**
 * Idempotency handling types for transaction request correlation.
 */
import type { AppError } from './errors';

export type IdempotencyKey = string;

export interface IdempotencyKeyParams {
  operation: string;
  userContext?: string;
  timestamp?: number;
}

export enum IdempotencyRequestState {
  PENDING = 'PENDING',
  IN_FLIGHT = 'IN_FLIGHT',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  UNKNOWN = 'UNKNOWN',
}

export interface IdempotencyRequest {
  key: IdempotencyKey;
  state: IdempotencyRequestState;
  operation: string;
  createdAt: number;
  updatedAt: number;
  txHash?: string;
  ledger?: number;
  error?: AppError;
  retryCount: number;
  maxRetries: number;
  context?: Record<string, unknown>;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingRequest?: IdempotencyRequest;
  reason?: string;
}

export interface RecoveryOptions {
  key: IdempotencyKey;
  timeoutMs?: number;
  pollIntervalMs?: number;
}

export interface RecoveryResult {
  recovered: boolean;
  request: IdempotencyRequest;
  txHash?: string;
  ledger?: number;
}

export enum StorageStrategy {
  MEMORY = 'MEMORY',
  SESSION = 'SESSION',
  LOCAL = 'LOCAL',
}

export interface StorageConfig {
  strategy: StorageStrategy;
  keyPrefix?: string;
  ttl?: number;
}

export interface IdempotencyService {
  generateKey(params: IdempotencyKeyParams): IdempotencyKey;
  checkDuplicate(key: IdempotencyKey): DuplicateCheckResult;
  registerRequest(
    key: IdempotencyKey,
    operation: string,
    context?: Record<string, unknown>,
  ): IdempotencyRequest;
  updateState(
    key: IdempotencyKey,
    state: IdempotencyRequestState,
    metadata?: Partial<Pick<IdempotencyRequest, 'txHash' | 'ledger' | 'error'>>,
  ): IdempotencyRequest;
  getRequest(key: IdempotencyKey): IdempotencyRequest | null;
  recoverRequest(options: RecoveryOptions): Promise<RecoveryResult>;
  clearExpired(): void;
  clearAll(): void;
}
