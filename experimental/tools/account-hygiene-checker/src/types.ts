export type HealthStatus = 'healthy' | 'warning' | 'danger';

/**
 * Minimum spendable-balance threshold (in XLM) below which an account is
 * flagged as low on fee-paying headroom, per the issue's
 * "< 2 XLM" acceptance criterion.
 */
export const LOW_FEE_BALANCE_XLM = 2;

/** Base reserve per Stellar protocol (in XLM, not stroops). */
export const BASE_RESERVE_XLM = 0.5;

/** Base account reserve multiplier: `(2 + subentries) * baseReserve`. */
export const BASE_RESERVE_ENTRIES = 2;

export interface TrustlineBalance {
  /** Absent for the native (XLM) balance line. */
  assetCode?: string;
  assetIssuer?: string;
  /** `native` for XLM, `credit_alphanum4`/`credit_alphanum12` for issued assets. */
  assetType: 'native' | 'credit_alphanum4' | 'credit_alphanum12';
  balance: string;
}

/**
 * Minimal shape of a Horizon account response needed for hygiene checks.
 * Mirrors the fields actually consumed from `AccountResponse` in
 * `@stellar/stellar-sdk` / the Horizon `/accounts/{id}` endpoint, so a
 * real Horizon response can be passed straight through without adapting.
 */
export interface StellarAccountSnapshot {
  accountId: string;
  /** Number of subentries (trustlines, offers, data entries, signers beyond the master key). */
  subentryCount: number;
  balances: TrustlineBalance[];
}

/** An address that Horizon reported as not found (HTTP 404 / unfunded). */
export interface UnactivatedAccount {
  accountId: string;
  activated: false;
}

export type AccountLookupResult =
  | ({ activated: true } & StellarAccountSnapshot)
  | UnactivatedAccount;

export interface RequiredTrustline {
  assetCode: string;
  assetIssuer: string;
}

export interface AccountHealthReport {
  accountId: string;
  activated: boolean;
  status: HealthStatus;
  nativeBalanceXlm: number;
  minReserveXlm: number;
  spendableBalanceXlm: number;
  subentryCount: number;
  lowFeeBalance: boolean;
  missingTrustlines: string[];
  reasons: string[];
}

export interface HygieneCheckOptions {
  requiredTrustlines: RequiredTrustline[];
}
