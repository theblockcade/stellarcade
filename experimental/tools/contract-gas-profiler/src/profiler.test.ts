import { describe, it, expect } from 'vitest';
import {
  profileContract,
  formatReport,
  staticWasmEstimator,
  DEFAULT_LEDGER_BUDGET,
} from './profiler';
import type { InvocationMetrics, LedgerBudget } from '../types';

/** Minimal valid WASM binary (magic + version, no sections). */
function makeMinimalWasm(): Buffer {
  return Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
}

/** A larger fake wasm buffer with a synthetic "code" section for size variance. */
function makeLargerWasm(padBytes: number): Buffer {
  const base = makeMinimalWasm();
  return Buffer.concat([base, Buffer.alloc(padBytes, 0x01)]);
}

describe('profileContract (simulated invocation profiling)', () => {
  it('produces a well-formed ProfileResult for a simple invocation', async () => {
    const wasm = makeLargerWasm(256);
    const result = await profileContract(wasm, 'transfer', [{ to: 'GABC', amount: 100 }]);

    expect(result.fnName).toBe('transfer');
    expect(result.args).toEqual([{ to: 'GABC', amount: 100 }]);
    expect(result.wasmSizeBytes).toBe(wasm.length);
    expect(result.metrics.cpuInstructions).toBeGreaterThan(0);
    expect(result.metrics.memoryBytes).toBeGreaterThan(0);
    expect(result.metrics.storageReads).toBeGreaterThanOrEqual(0);
    expect(result.metrics.storageWrites).toBeGreaterThanOrEqual(0);
    expect(result.cpuPct).toBeGreaterThan(0);
    expect(result.memPct).toBeGreaterThan(0);
    expect(result.exceededThreshold).toBe(false);
  });

  it('is deterministic for identical wasm/fn/args', async () => {
    const wasm = makeLargerWasm(512);
    const r1 = await profileContract(wasm, 'mint', [1, 2, 3]);
    const r2 = await profileContract(wasm, 'mint', [1, 2, 3]);
    expect(r1.metrics).toEqual(r2.metrics);
    expect(r1.cpuPct).toEqual(r2.cpuPct);
  });

  it('produces higher estimated CPU usage for larger wasm binaries', async () => {
    const small = makeLargerWasm(16);
    const large = makeLargerWasm(4096);
    const rSmall = await profileContract(small, 'noop', []);
    const rLarge = await profileContract(large, 'noop', []);
    expect(rLarge.metrics.cpuInstructions).toBeGreaterThan(rSmall.metrics.cpuInstructions);
  });

  it('varies estimate with argument complexity', async () => {
    const wasm = makeLargerWasm(64);
    const simple = await profileContract(wasm, 'call', [1]);
    const complex = await profileContract(wasm, 'call', [
      { nested: { list: [1, 2, 3, 4, 5], text: 'a fairly long string argument here' } },
    ]);
    expect(complex.metrics.cpuInstructions).toBeGreaterThan(simple.metrics.cpuInstructions);
  });

  describe('threshold breach behavior', () => {
    it('flags exceededThreshold when a low maxCpuPct is configured', async () => {
      const wasm = makeLargerWasm(1024);
      const result = await profileContract(wasm, 'expensive_op', [], { maxCpuPct: 0.0001 });
      expect(result.exceededThreshold).toBe(true);
      expect(result.cpuPct).toBeGreaterThan(0.0001);
    });

    it('does not flag exceededThreshold when threshold is generous', async () => {
      const wasm = makeMinimalWasm();
      const result = await profileContract(wasm, 'cheap_op', [], { maxCpuPct: 100 });
      expect(result.exceededThreshold).toBe(false);
    });

    it('respects a custom (smaller) ledger budget, raising percentages', async () => {
      const wasm = makeLargerWasm(2048);
      const tinyBudget: LedgerBudget = {
        maxCpuInstructions: 100,
        maxMemoryBytes: 100,
        maxStorageEntries: 1,
      };
      const result = await profileContract(wasm, 'op', [], { budget: tinyBudget, maxCpuPct: 50 });
      expect(result.cpuPct).toBeGreaterThan(50);
      expect(result.exceededThreshold).toBe(true);
    });
  });

  describe('pluggable estimator', () => {
    it('allows a custom estimator to fully control metrics', async () => {
      const fixedMetrics: InvocationMetrics = {
        cpuInstructions: 42,
        memoryBytes: 1000,
        storageReads: 1,
        storageWrites: 1,
      };
      const wasm = makeMinimalWasm();
      const result = await profileContract(wasm, 'anything', [], {
        estimator: () => fixedMetrics,
      });
      expect(result.metrics).toEqual(fixedMetrics);
      expect(result.cpuPct).toBe(
        Math.round((42 / DEFAULT_LEDGER_BUDGET.maxCpuInstructions) * 100 * 100) / 100
      );
    });

    it('staticWasmEstimator returns non-negative integer-ish metrics', () => {
      const wasm = makeLargerWasm(200);
      const metrics = staticWasmEstimator(wasm, 'fn', ['x', 2, true]);
      expect(metrics.cpuInstructions).toBeGreaterThanOrEqual(0);
      expect(metrics.memoryBytes).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(metrics.storageReads)).toBe(true);
      expect(Number.isFinite(metrics.storageWrites)).toBe(true);
    });
  });
});

describe('formatReport (terminal metric summary table)', () => {
  it('includes function name, args, and metric rows', async () => {
    const wasm = makeMinimalWasm();
    const result = await profileContract(wasm, 'roll_dice', [7], { wasmPath: '/tmp/x.wasm' });
    const output = formatReport(result);

    expect(output).toContain('roll_dice');
    expect(output).toContain('7');
    expect(output).toContain('CPU instructions');
    expect(output).toContain('Memory bytes');
    expect(output).toContain('Storage ops');
    expect(output).toContain('/tmp/x.wasm');
  });

  it('shows a WARNING line when the threshold was exceeded', async () => {
    const wasm = makeLargerWasm(1024);
    const result = await profileContract(wasm, 'expensive', [], { maxCpuPct: 0.0001 });
    const output = formatReport(result);
    expect(output).toMatch(/WARNING/);
  });

  it('shows an OK line when within threshold', async () => {
    const wasm = makeMinimalWasm();
    const result = await profileContract(wasm, 'cheap', [], { maxCpuPct: 100 });
    const output = formatReport(result);
    expect(output).toMatch(/OK/);
  });

  it('renders percentage values with two decimal places', async () => {
    const wasm = makeMinimalWasm();
    const result = await profileContract(wasm, 'fn', []);
    const output = formatReport(result);
    expect(output).toMatch(/\d+\.\d{2}%/);
  });
});
