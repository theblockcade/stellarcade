import { promises as fs } from 'fs';
import type { AccountHealthReport, AccountLookupResult, RequiredTrustline, StellarAccountSnapshot, TrustlineBalance } from './types';
import { evaluateAccountHealth } from './rules';

export type Network = 'testnet' | 'mainnet';

export const HORIZON_URLS: Record<Network, string> = {
  testnet: 'https://horizon-testnet.stellar.org',
  mainnet: 'https://horizon.stellar.org',
};

export const FRIENDBOT_URL = 'https://friendbot.stellar.org';

/** Shape of the subset of Horizon's `/accounts/{id}` response this tool consumes. */
interface HorizonAccountResponse {
  account_id: string;
  subentry_count: number;
  balances: Array<{
    asset_type: string;
    asset_code?: string;
    asset_issuer?: string;
    balance: string;
  }>;
}

function toSnapshot(raw: HorizonAccountResponse): StellarAccountSnapshot {
  const balances: TrustlineBalance[] = raw.balances.map((b) => ({
    assetType: b.asset_type as TrustlineBalance['assetType'],
    assetCode: b.asset_code,
    assetIssuer: b.asset_issuer,
    balance: b.balance,
  }));

  return {
    accountId: raw.account_id,
    subentryCount: raw.subentry_count,
    balances,
  };
}

/**
 * Fetches a single account from Horizon and normalizes it into an
 * {@link AccountLookupResult}. A 404 response (account not yet funded /
 * activated) resolves to `{ activated: false }` rather than throwing, so
 * a batch of mixed funded/unfunded addresses can still produce a full
 * report per the "flags unactivated (404) accounts" acceptance
 * criterion. Any other non-2xx response or network failure throws, since
 * that indicates a real problem (bad Horizon URL, rate limit, etc.)
 * rather than an expected "account doesn't exist yet" case.
 */
export async function lookupAccount(accountId: string, horizonUrl: string): Promise<AccountLookupResult> {
  const response = await fetch(`${horizonUrl.replace(/\/$/, '')}/accounts/${accountId}`);

  if (response.status === 404) {
    return { accountId, activated: false };
  }
  if (!response.ok) {
    throw new Error(`Horizon returned ${response.status} for account ${accountId}: ${await response.text()}`);
  }

  const raw = (await response.json()) as HorizonAccountResponse;
  return { activated: true, ...toSnapshot(raw) };
}

/**
 * Looks up a batch of accounts sequentially (to stay well under Horizon's
 * rate limits for larger address lists) and returns one result per
 * input address, in the same order.
 */
export async function lookupAccounts(accountIds: string[], horizonUrl: string): Promise<AccountLookupResult[]> {
  const results: AccountLookupResult[] = [];
  for (const accountId of accountIds) {
    results.push(await lookupAccount(accountId, horizonUrl));
  }
  return results;
}

/**
 * Requests testnet funding for `accountId` via Friendbot. Throws on a
 * non-2xx response (e.g. Friendbot rejecting a mainnet-shaped address,
 * or an already-funded account depending on Friendbot's current
 * behavior) so callers can report the failure rather than silently
 * treating it as success.
 */
export async function fundWithFriendbot(accountId: string, friendbotUrl: string = FRIENDBOT_URL): Promise<void> {
  const response = await fetch(`${friendbotUrl}?addr=${encodeURIComponent(accountId)}`);
  if (!response.ok) {
    throw new Error(`Friendbot funding failed for ${accountId}: ${response.status} ${await response.text()}`);
  }
}

/**
 * Loads a list of account addresses from either a JSON file (an array,
 * `["G...", "G..."]`) or a plain CSV/newline-delimited file (one address
 * per line, optionally comma-separated). Blank lines and surrounding
 * whitespace are ignored. Content that looks like JSON (starts with `[`
 * or `{`) but does not parse to an array throws rather than silently
 * falling through to the plain-text parser.
 */
export async function loadAddresses(path: string): Promise<string[]> {
  const raw = await fs.readFile(path, 'utf-8');
  const trimmed = raw.trim();

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) {
      throw new Error(`Expected ${path} to contain a JSON array of addresses`);
    }
    return parsed.map((v) => String(v).trim()).filter(Boolean);
  }

  return trimmed
    .split(/\r?\n/)
    .flatMap((line) => line.split(','))
    .map((v) => v.trim())
    .filter(Boolean);
}

export interface CheckAccountsOptions {
  autoFund: boolean;
}

/**
 * Looks up and evaluates every address, optionally auto-funding
 * unactivated testnet accounts via Friendbot and re-verifying their
 * health afterward. Runs sequentially (not in parallel) to stay under
 * Horizon/Friendbot rate limits for larger address lists.
 */
export async function checkAccounts(
  addresses: string[],
  horizonUrl: string,
  requiredTrustlines: RequiredTrustline[],
  options: CheckAccountsOptions,
  onFunding?: (accountId: string) => void,
  onFundingError?: (accountId: string, error: Error) => void
): Promise<AccountHealthReport[]> {
  const reports: AccountHealthReport[] = [];

  for (const accountId of addresses) {
    let result = await lookupAccount(accountId, horizonUrl);

    if (!result.activated && options.autoFund) {
      onFunding?.(accountId);
      try {
        await fundWithFriendbot(accountId);
        result = await lookupAccount(accountId, horizonUrl);
      } catch (err) {
        onFundingError?.(accountId, err as Error);
      }
    }

    reports.push(evaluateAccountHealth(result, { requiredTrustlines }));
  }

  return reports;
}
