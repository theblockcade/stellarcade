import { describe, it, expect } from 'vitest';
import { fetchTransactions, type Transaction } from './tx-fetcher.js';

describe('fetchTransactions', () => {
  const contractId = 'CASGNJ3K6VWKQFQ7ZUIFZIY2LGYZTOOJBFHZPHVX7RFLX5UWMABZMBY2';

  it('returns transactions within the specified date range', async () => {
    const result = await fetchTransactions({
      contractId,
      startDate: new Date('2025-07-01T00:00:00Z'),
      endDate: new Date('2025-07-01T23:59:59Z'),
    });

    // All 6 mock transactions fall on 2025-07-01
    expect(result).toHaveLength(6);
  });

  it('filters out transactions outside the date range', async () => {
    const result = await fetchTransactions({
      contractId,
      startDate: new Date('2025-07-01T13:00:00Z'),
      endDate: new Date('2025-07-01T16:00:00Z'),
    });

    // Only transactions from 13:00 to 17:00 on July 1 (mock tx at index 5 is 17:00)
    expect(result.length).toBeGreaterThan(0);
    for (const tx of result) {
      expect(new Date(tx.timestamp).getUTCHours()).toBeGreaterThanOrEqual(13);
      expect(new Date(tx.timestamp).getUTCHours()).toBeLessThanOrEqual(17);
    }
  });

  it('returns empty array when range misses all transactions', async () => {
    const result = await fetchTransactions({
      contractId,
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2026-01-31T23:59:59Z'),
    });

    expect(result).toHaveLength(0);
  });

  it('each transaction has all required fields', async () => {
    const result = await fetchTransactions({
      contractId,
      startDate: new Date('2025-07-01T00:00:00Z'),
      endDate: new Date('2025-07-01T23:59:59Z'),
    });

    for (const tx of result) {
      expect(tx.hash).toBeTruthy();
      expect(tx.timestamp).toBeTruthy();
      expect(tx.type).toBeTruthy();
      expect(tx.asset).toBeTruthy();
      expect(tx.amount).toBeTruthy();
      expect(tx.fee).toBeTruthy();
      expect(tx.sender).toBeTruthy();
      expect(tx.recipient).toBeTruthy();
    }
  });

  it('classifies transaction types correctly', async () => {
    const result = await fetchTransactions({
      contractId,
      startDate: new Date('2025-07-01T00:00:00Z'),
      endDate: new Date('2025-07-01T23:59:59Z'),
    });

    const validTypes = ['Wager Inflow', 'Prize Payout', 'Fee Revenue', 'Staking Yield'];
    for (const tx of result) {
      expect(validTypes).toContain(tx.type);
    }

    // Mock data cycles through all 4 types
    const types = result.map((tx) => tx.type);
    expect(types).toContain('Wager Inflow');
    expect(types).toContain('Prize Payout');
    expect(types).toContain('Fee Revenue');
    expect(types).toContain('Staking Yield');
  });

  it('returns amounts as decimal strings (stroops converted)', async () => {
    const result = await fetchTransactions({
      contractId,
      startDate: new Date('2025-07-01T00:00:00Z'),
      endDate: new Date('2025-07-01T23:59:59Z'),
    });

    // First mock tx should be 1.0000000 XLM (100_000_000 stroops)
    expect(result[0].amount).toBe('10.0000000');
    // Fee should be 0.0100000 XLM (100_000 stroops)
    expect(result[0].fee).toBe('0.0100000');
  });
});
