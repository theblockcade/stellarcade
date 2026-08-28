import { describe, it, expect, vi } from 'vitest';
import { toMarkdownTable, printJson } from './reporter';
import type { ProfileResult } from './types';

function result(overrides: Partial<ProfileResult> = {}): ProfileResult {
  return {
    contractId: 'CABC123',
    method: 'transfer',
    metrics: { cpuInstructions: 1_000_000, memoryBytes: 500_000 },
    utilization: { cpuPercent: 1, memoryPercent: 1.2, cpuLevel: 'green', memoryLevel: 'green' },
    warnings: [],
    ...overrides,
  };
}

describe('toMarkdownTable', () => {
  it('renders a valid markdown table with a header and one row per result', () => {
    const table = toMarkdownTable([result()]);
    const lines = table.split('\n');

    expect(lines[0]).toContain('| Contract | Method |');
    expect(lines[1]).toMatch(/^\|---/);
    expect(lines[2]).toContain('CABC123');
    expect(lines[2]).toContain('transfer');
    expect(lines[2]).toContain('1,000,000');
  });

  it('marks a green result as OK', () => {
    const table = toMarkdownTable([result()]);
    expect(table).toContain('🟢 OK');
  });

  it('marks a yellow result as approaching limit', () => {
    const table = toMarkdownTable([
      result({ utilization: { cpuPercent: 50, memoryPercent: 5, cpuLevel: 'yellow', memoryLevel: 'green' } }),
    ]);
    expect(table).toContain('🟡 Approaching limit');
  });

  it('marks a red result as over budget', () => {
    const table = toMarkdownTable([
      result({ utilization: { cpuPercent: 95, memoryPercent: 5, cpuLevel: 'red', memoryLevel: 'green' } }),
    ]);
    expect(table).toContain('🔴 Over budget');
  });

  it('renders multiple rows for multiple results', () => {
    const table = toMarkdownTable([
      result({ method: 'deposit' }),
      result({ method: 'withdraw' }),
    ]);
    expect(table.split('\n')).toHaveLength(4); // header + separator + 2 rows
  });

  it('renders just the header for an empty result set', () => {
    const table = toMarkdownTable([]);
    expect(table.split('\n')).toHaveLength(2);
  });
});

describe('printJson', () => {
  it('prints valid, parseable JSON of the result', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    printJson(result());

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const output = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed.contractId).toBe('CABC123');

    consoleSpy.mockRestore();
  });
});
