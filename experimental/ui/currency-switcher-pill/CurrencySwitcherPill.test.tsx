import { describe, it, expect } from 'vitest';
import { formatCurrencyBalance } from './CurrencySwitcherPill';

describe('CurrencySwitcherPill', () => {
  it('formats XLM balance with 4 decimal places', () => {
    expect(formatCurrencyBalance('XLM', 1250.5, 5000, 0.12, 0.05)).toBe('1,250.5000 XLM');
    expect(formatCurrencyBalance('XLM', 0, 0, 0.12)).toBe('0.0000 XLM');
  });

  it('formats ARCADE token balance with 4 decimal places', () => {
    expect(formatCurrencyBalance('ARCADE', 1250.5, 5000, 0.12, 0.05)).toBe('5,000.0000 ARCADE');
    expect(formatCurrencyBalance('ARCADE', 0, 100.5, 0.12)).toBe('100.5000 ARCADE');
  });

  it('calculates total USD valuation combining XLM and ARCADE balances', () => {
    // 100 XLM * $0.12 = $12.00
    // 500 ARCADE * $0.05 = $25.00
    // Total USD = $37.00
    expect(formatCurrencyBalance('USD', 100, 500, 0.12, 0.05)).toBe('$37.00');

    // 1250.5 XLM * $0.12 = 150.06
    // 5000 ARCADE * $0.05 = 250.00
    // Total USD = $400.06
    expect(formatCurrencyBalance('USD', 1250.5, 5000, 0.12, 0.05)).toBe('$400.06');
  });

  it('handles zero balances for USD', () => {
    expect(formatCurrencyBalance('USD', 0, 0, 0.12, 0.05)).toBe('$0.00');
  });
});
