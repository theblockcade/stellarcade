import { describe, it, expect } from 'vitest';
import {
  computeMinReserveXlm,
  evaluateAccountHealth,
  findMissingTrustlines,
  getNativeBalanceXlm,
} from './rules';
import type { AccountLookupResult, RequiredTrustline, TrustlineBalance } from './types';

describe('computeMinReserveXlm', () => {
  it('computes the base reserve for an account with no subentries', () => {
    // (2 + 0) * 0.5 = 1
    expect(computeMinReserveXlm(0)).toBe(1);
  });

  it('adds one reserve unit per subentry', () => {
    // (2 + 3) * 0.5 = 2.5
    expect(computeMinReserveXlm(3)).toBe(2.5);
  });

  it('respects a custom base reserve', () => {
    expect(computeMinReserveXlm(2, 1)).toBe(4); // (2 + 2) * 1
  });

  it('treats a negative subentry count as 0', () => {
    expect(computeMinReserveXlm(-5)).toBe(1);
  });

  it('treats a NaN subentry count as 0', () => {
    expect(computeMinReserveXlm(NaN)).toBe(1);
  });
});

describe('getNativeBalanceXlm', () => {
  it('extracts the native balance line', () => {
    const balances: TrustlineBalance[] = [
      { assetType: 'native', balance: '123.4567890' },
      { assetType: 'credit_alphanum4', assetCode: 'USDC', assetIssuer: 'GISSUER', balance: '10' },
    ];
    expect(getNativeBalanceXlm(balances)).toBeCloseTo(123.456789);
  });

  it('returns 0 when there is no native balance line', () => {
    const balances: TrustlineBalance[] = [
      { assetType: 'credit_alphanum4', assetCode: 'USDC', assetIssuer: 'GISSUER', balance: '10' },
    ];
    expect(getNativeBalanceXlm(balances)).toBe(0);
  });
});

describe('findMissingTrustlines', () => {
  const required: RequiredTrustline[] = [
    { assetCode: 'USDC', assetIssuer: 'GISSUER1' },
    { assetCode: 'GAME', assetIssuer: 'GISSUER2' },
  ];

  it('returns all required trustlines when none are present', () => {
    const balances: TrustlineBalance[] = [{ assetType: 'native', balance: '100' }];
    expect(findMissingTrustlines(balances, required)).toEqual(['USDC:GISSUER1', 'GAME:GISSUER2']);
  });

  it('returns an empty array when all required trustlines are present', () => {
    const balances: TrustlineBalance[] = [
      { assetType: 'native', balance: '100' },
      { assetType: 'credit_alphanum4', assetCode: 'USDC', assetIssuer: 'GISSUER1', balance: '0' },
      { assetType: 'credit_alphanum4', assetCode: 'GAME', assetIssuer: 'GISSUER2', balance: '50' },
    ];
    expect(findMissingTrustlines(balances, required)).toEqual([]);
  });

  it('does not match a trustline with the same code but a different issuer', () => {
    const balances: TrustlineBalance[] = [
      { assetType: 'credit_alphanum4', assetCode: 'USDC', assetIssuer: 'GDIFFERENT', balance: '0' },
    ];
    expect(findMissingTrustlines(balances, [{ assetCode: 'USDC', assetIssuer: 'GISSUER1' }])).toEqual([
      'USDC:GISSUER1',
    ]);
  });

  it('returns an empty array when no trustlines are required', () => {
    expect(findMissingTrustlines([{ assetType: 'native', balance: '100' }], [])).toEqual([]);
  });
});

describe('evaluateAccountHealth', () => {
  const noTrustlines = { requiredTrustlines: [] as RequiredTrustline[] };

  it('flags an unactivated account as danger with zeroed fields', () => {
    const result: AccountLookupResult = { accountId: 'GUNFUNDED', activated: false };
    const report = evaluateAccountHealth(result, noTrustlines);

    expect(report.status).toBe('danger');
    expect(report.activated).toBe(false);
    expect(report.nativeBalanceXlm).toBe(0);
    expect(report.spendableBalanceXlm).toBe(0);
    expect(report.reasons).toEqual([
      'Account is not activated on the network (no funding transaction has been received).',
    ]);
  });

  it('marks a well-funded account with no subentries as healthy', () => {
    const result: AccountLookupResult = {
      activated: true,
      accountId: 'GHEALTHY',
      subentryCount: 0,
      balances: [{ assetType: 'native', balance: '100' }],
    };
    const report = evaluateAccountHealth(result, noTrustlines);

    expect(report.status).toBe('healthy');
    expect(report.minReserveXlm).toBe(1); // (2 + 0) * 0.5
    expect(report.spendableBalanceXlm).toBe(99);
    expect(report.lowFeeBalance).toBe(false);
    expect(report.reasons).toEqual([]);
  });

  it('marks an account with spendable balance below the fee threshold as warning', () => {
    // minReserve = 1, balance = 2.5 -> spendable = 1.5 < 2 XLM threshold, but still >= 0
    const result: AccountLookupResult = {
      activated: true,
      accountId: 'GLOWFEE',
      subentryCount: 0,
      balances: [{ assetType: 'native', balance: '2.5' }],
    };
    const report = evaluateAccountHealth(result, noTrustlines);

    expect(report.status).toBe('warning');
    expect(report.lowFeeBalance).toBe(true);
    expect(report.spendableBalanceXlm).toBeCloseTo(1.5);
    expect(report.reasons[0]).toMatch(/fee-headroom threshold/);
  });

  it('marks an account below the minimum reserve as danger', () => {
    // minReserve = (2+5)*0.5 = 3.5, balance = 1 -> spendable = -2.5
    const result: AccountLookupResult = {
      activated: true,
      accountId: 'GUNDERRESERVED',
      subentryCount: 5,
      balances: [{ assetType: 'native', balance: '1' }],
    };
    const report = evaluateAccountHealth(result, noTrustlines);

    expect(report.status).toBe('danger');
    expect(report.spendableBalanceXlm).toBeCloseTo(-2.5);
    expect(report.reasons[0]).toMatch(/below the minimum reserve requirement/);
  });

  it('marks an otherwise-healthy account with a missing required trustline as danger', () => {
    const result: AccountLookupResult = {
      activated: true,
      accountId: 'GMISSINGTRUST',
      subentryCount: 0,
      balances: [{ assetType: 'native', balance: '1000' }],
    };
    const report = evaluateAccountHealth(result, {
      requiredTrustlines: [{ assetCode: 'USDC', assetIssuer: 'GISSUER1' }],
    });

    expect(report.status).toBe('danger');
    expect(report.missingTrustlines).toEqual(['USDC:GISSUER1']);
    expect(report.reasons.some((r) => r.includes('Missing required trustline'))).toBe(true);
  });

  it('reports zero spendable balance (exactly at reserve) as not-negative and evaluates the fee threshold', () => {
    // minReserve = 1, balance = 1 -> spendable = 0, which is < 2 XLM threshold -> warning, not danger
    const result: AccountLookupResult = {
      activated: true,
      accountId: 'GEXACT',
      subentryCount: 0,
      balances: [{ assetType: 'native', balance: '1' }],
    };
    const report = evaluateAccountHealth(result, noTrustlines);

    expect(report.spendableBalanceXlm).toBe(0);
    expect(report.status).toBe('warning');
  });
});
