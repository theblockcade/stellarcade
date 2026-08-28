import { describe, it, expect } from 'vitest';
import {
  extractMetrics,
  budgetPercent,
  levelForPercent,
  computeUtilization,
  generateWarnings,
} from './profiler';
import { NETWORK_LIMITS } from './types';

describe('extractMetrics', () => {
  it('parses decimal-string cost fields into numbers', () => {
    const metrics = extractMetrics({ cpuInsns: '1500000', memBytes: '2048000' });
    expect(metrics.cpuInstructions).toBe(1_500_000);
    expect(metrics.memoryBytes).toBe(2_048_000);
  });

  it('handles zero-cost simulations', () => {
    const metrics = extractMetrics({ cpuInsns: '0', memBytes: '0' });
    expect(metrics.cpuInstructions).toBe(0);
    expect(metrics.memoryBytes).toBe(0);
  });
});

describe('budgetPercent', () => {
  it('computes a straightforward percentage', () => {
    expect(budgetPercent(20, 100)).toBe(20);
  });

  it('can exceed 100% when usage is over the limit (not clamped)', () => {
    expect(budgetPercent(150, 100)).toBe(150);
  });

  it('returns 0 for a zero or negative limit rather than dividing by zero', () => {
    expect(budgetPercent(50, 0)).toBe(0);
    expect(budgetPercent(50, -10)).toBe(0);
  });
});

describe('levelForPercent', () => {
  it('classifies under 20% as green', () => {
    expect(levelForPercent(0)).toBe('green');
    expect(levelForPercent(19.9)).toBe('green');
  });

  it('classifies 20% up to 80% as yellow', () => {
    expect(levelForPercent(20)).toBe('yellow');
    expect(levelForPercent(50)).toBe('yellow');
    expect(levelForPercent(80)).toBe('yellow');
  });

  it('classifies over 80% as red', () => {
    expect(levelForPercent(80.1)).toBe('red');
    expect(levelForPercent(150)).toBe('red');
  });
});

describe('computeUtilization', () => {
  it('computes both CPU and memory percentages against network limits', () => {
    const utilization = computeUtilization({
      cpuInstructions: NETWORK_LIMITS.maxCpuInstructions * 0.1,
      memoryBytes: NETWORK_LIMITS.maxMemoryBytes * 0.5,
    });
    expect(utilization.cpuPercent).toBeCloseTo(10);
    expect(utilization.cpuLevel).toBe('green');
    expect(utilization.memoryPercent).toBeCloseTo(50);
    expect(utilization.memoryLevel).toBe('yellow');
  });
});

describe('generateWarnings', () => {
  it('produces no warnings when both metrics are green', () => {
    const warnings = generateWarnings({
      cpuPercent: 5,
      memoryPercent: 5,
      cpuLevel: 'green',
      memoryLevel: 'green',
    });
    expect(warnings).toEqual([]);
  });

  it('warns for yellow-level CPU usage approaching the ceiling', () => {
    const warnings = generateWarnings({
      cpuPercent: 55,
      memoryPercent: 5,
      cpuLevel: 'yellow',
      memoryLevel: 'green',
    });
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('approaching the ceiling');
  });

  it('warns critically for red-level usage on both metrics independently', () => {
    const warnings = generateWarnings({
      cpuPercent: 95,
      memoryPercent: 90,
      cpuLevel: 'red',
      memoryLevel: 'red',
    });
    expect(warnings).toHaveLength(2);
    expect(warnings[0]).toContain('critical');
    expect(warnings[1]).toContain('critical');
  });
});
