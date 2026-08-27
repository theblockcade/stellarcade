import {
  BASE_RESERVE_ENTRIES,
  BASE_RESERVE_XLM,
  LOW_FEE_BALANCE_XLM,
  type AccountHealthReport,
  type AccountLookupResult,
  type HygieneCheckOptions,
  type RequiredTrustline,
  type TrustlineBalance,
} from './types';

/**
 * Computes the minimum XLM an account must hold to remain valid per the
 * Stellar base reserve formula: `(2 + subentries) * baseReserve`. The
 * leading `2` accounts for the account entry itself; each subentry
 * (trustline, offer, data entry, extra signer) adds one more reserve
 * unit.
 */
export function computeMinReserveXlm(subentryCount: number, baseReserveXlm = BASE_RESERVE_XLM): number {
  const subentries = Number.isFinite(subentryCount) && subentryCount > 0 ? subentryCount : 0;
  return (BASE_RESERVE_ENTRIES + subentries) * baseReserveXlm;
}

/** Extracts the native (XLM) balance from a Horizon-shaped balances array, or 0 if absent. */
export function getNativeBalanceXlm(balances: TrustlineBalance[]): number {
  const native = balances.find((b) => b.assetType === 'native');
  return native ? parseFloat(native.balance) : 0;
}

/**
 * Returns the subset of `required` trustlines that are absent from
 * `balances`. An asset is considered present if a matching
 * (assetCode, assetIssuer) credit balance line exists, regardless of
 * balance amount (a zero-balance trustline still "counts" as having the
 * line established).
 */
export function findMissingTrustlines(
  balances: TrustlineBalance[],
  required: RequiredTrustline[]
): string[] {
  const missing: string[] = [];
  for (const req of required) {
    const hasLine = balances.some(
      (b) =>
        b.assetType !== 'native' &&
        b.assetCode === req.assetCode &&
        b.assetIssuer === req.assetIssuer
    );
    if (!hasLine) {
      missing.push(`${req.assetCode}:${req.assetIssuer}`);
    }
  }
  return missing;
}

/**
 * Evaluates a single account lookup result against the hygiene rules
 * (minimum reserve, low fee-balance threshold, required trustlines) and
 * produces a full health report with a rolled-up status.
 *
 * Unactivated (404 / not-yet-funded) accounts are reported as `danger`
 * with all balance-derived fields zeroed out, per the "flags
 * unactivated accounts" acceptance criterion — they never reach the
 * reserve/trustline math below since there is no ledger entry to
 * evaluate.
 */
export function evaluateAccountHealth(
  result: AccountLookupResult,
  options: HygieneCheckOptions,
  baseReserveXlm = BASE_RESERVE_XLM
): AccountHealthReport {
  if (!result.activated) {
    return {
      accountId: result.accountId,
      activated: false,
      status: 'danger',
      nativeBalanceXlm: 0,
      minReserveXlm: 0,
      spendableBalanceXlm: 0,
      subentryCount: 0,
      lowFeeBalance: true,
      missingTrustlines: options.requiredTrustlines.map((t) => `${t.assetCode}:${t.assetIssuer}`),
      reasons: ['Account is not activated on the network (no funding transaction has been received).'],
    };
  }

  const minReserveXlm = computeMinReserveXlm(result.subentryCount, baseReserveXlm);
  const nativeBalanceXlm = getNativeBalanceXlm(result.balances);
  const spendableBalanceXlm = nativeBalanceXlm - minReserveXlm;
  const missingTrustlines = findMissingTrustlines(result.balances, options.requiredTrustlines);
  const lowFeeBalance = spendableBalanceXlm < LOW_FEE_BALANCE_XLM;

  const reasons: string[] = [];
  if (spendableBalanceXlm < 0) {
    reasons.push(
      `Balance (${nativeBalanceXlm.toFixed(7)} XLM) is below the minimum reserve requirement ` +
        `(${minReserveXlm.toFixed(7)} XLM for ${result.subentryCount} subentries).`
    );
  } else if (lowFeeBalance) {
    reasons.push(
      `Spendable balance (${spendableBalanceXlm.toFixed(7)} XLM) is below the ` +
        `${LOW_FEE_BALANCE_XLM} XLM fee-headroom threshold.`
    );
  }
  if (missingTrustlines.length > 0) {
    reasons.push(`Missing required trustline(s): ${missingTrustlines.join(', ')}.`);
  }

  let status: AccountHealthReport['status'] = 'healthy';
  if (spendableBalanceXlm < 0 || missingTrustlines.length > 0) {
    status = 'danger';
  } else if (lowFeeBalance) {
    status = 'warning';
  }

  return {
    accountId: result.accountId,
    activated: true,
    status,
    nativeBalanceXlm,
    minReserveXlm,
    spendableBalanceXlm,
    subentryCount: result.subentryCount,
    lowFeeBalance,
    missingTrustlines,
    reasons,
  };
}
