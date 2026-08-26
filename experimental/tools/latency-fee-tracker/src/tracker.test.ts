import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { calculateMetrics, fetchLedgerSamples, formatMetricsSummary, writeMetricsToJson } from './tracker.js';
import { LedgerSample } from './types.js';

describe('Latency & Fee Tracker Unit Tests', () => {
  const mockSamples: LedgerSample[] = [
    {
      sequence: 100,
      closedAt: '2026-08-26T00:00:00Z',
      transactionCount: 2,
      avgLatencyMs: 1600,
      transactions: [
        { hash: '100-0', feeCharged: 100, maxFee: 200, latencyMs: 1500 },
        { hash: '100-1', feeCharged: 150, maxFee: 300, latencyMs: 1700 },
      ],
    },
    {
      sequence: 101,
      closedAt: '2026-08-26T00:00:05Z',
      transactionCount: 1,
      avgLatencyMs: 1200,
      transactions: [
        { hash: '101-0', feeCharged: 200, maxFee: 400, latencyMs: 1200 },
      ],
    },
  ];

  it('calculates average latency and fee metrics correctly', () => {
    const metrics = calculateMetrics(mockSamples, 'https://rpc.example.com');

    expect(metrics.sampledLedgersCount).toBe(2);
    expect(metrics.totalTransactionsProcessed).toBe(3);
    // (1500 + 1700 + 1200) / 3 = 4400 / 3 = 1466.66 -> 1467
    expect(metrics.avgLatencyMs).toBe(1467);
    // (100 + 150 + 200) / 3 = 450 / 3 = 150
    expect(metrics.avgFeeStroops).toBe(150);
    expect(metrics.minFeeStroops).toBe(100);
    expect(metrics.maxFeeStroops).toBe(200);
    expect(metrics.rpcUrl).toBe('https://rpc.example.com');
  });

  it('handles empty ledger samples safely', () => {
    const metrics = calculateMetrics([], 'https://rpc.example.com');

    expect(metrics.sampledLedgersCount).toBe(0);
    expect(metrics.totalTransactionsProcessed).toBe(0);
    expect(metrics.avgLatencyMs).toBe(0);
    expect(metrics.avgFeeStroops).toBe(0);
    expect(metrics.minFeeStroops).toBe(0);
    expect(metrics.maxFeeStroops).toBe(0);
  });

  it('formats metrics summary output correctly', () => {
    const metrics = calculateMetrics(mockSamples, 'https://rpc.example.com');
    const summary = formatMetricsSummary(metrics);

    expect(summary).toContain('Stellar Ledger Latency & Fee Report');
    expect(summary).toContain('https://rpc.example.com');
    expect(summary).toContain('Average Latency (ms): 1467 ms');
    expect(summary).toContain('Average Fee (stroop): 150 stroops');
    expect(summary).toContain('Minimum Fee (stroop): 100 stroops');
    expect(summary).toContain('Maximum Fee (stroop): 200 stroops');
  });

  it('writes JSON metrics file successfully', () => {
    const metrics = calculateMetrics(mockSamples, 'https://rpc.example.com');
    const testOutPath = path.join(__dirname, '../temp_test_output/metrics.json');

    writeMetricsToJson(metrics, testOutPath);

    expect(fs.existsSync(testOutPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(testOutPath, 'utf-8'));
    expect(content.totalTransactionsProcessed).toBe(3);

    // Clean up
    fs.rmSync(path.dirname(testOutPath), { recursive: true, force: true });
  });

  it('fetches ledger samples using injected mock fetch', async () => {
    const mockResponseData = {
      _embedded: {
        records: [
          {
            sequence: 500,
            closed_at: '2026-08-26T08:00:00Z',
            successful_transaction_count: 2,
            base_fee_in_stroops: 100,
          },
        ],
      },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponseData,
    });

    const samples = await fetchLedgerSamples('https://testnet.stellar.org', 1, mockFetch as any);

    expect(mockFetch).toHaveBeenCalledWith('https://testnet.stellar.org/ledgers?order=desc&limit=1');
    expect(samples.length).toBe(1);
    expect(samples[0].sequence).toBe(500);
    expect(samples[0].transactionCount).toBe(2);
  });

  it('throws helpful error on RPC fetch failure', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(
      fetchLedgerSamples('https://bad-rpc.example.com', 5, mockFetch as any)
    ).rejects.toThrow('Failed to fetch ledger data from https://bad-rpc.example.com: RPC HTTP 500: Internal Server Error');
  });
});
