import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  TokenSwapRateCalculator,
  calculateSwapQuote,
  formatTokenAmount,
  clampSlippagePct,
} from './TokenSwapRateCalculator';

describe('calculateSwapQuote', () => {
  it('computes output, fee, and minimum received', () => {
    const quote = calculateSwapQuote(100, 2, 0.3, 0.5);
    expect(quote.outputAmount).toBeCloseTo(199.4, 4);
    expect(quote.feeAmount).toBeCloseTo(0.6, 4);
    expect(quote.minReceived).toBeCloseTo(198.403, 3);
  });

  it('returns zeros for non-positive amount or rate', () => {
    expect(calculateSwapQuote(0, 2, 0.3, 0.5)).toEqual({
      outputAmount: 0,
      feeAmount: 0,
      minReceived: 0,
    });
    expect(calculateSwapQuote(100, 0, 0.3, 0.5)).toEqual({
      outputAmount: 0,
      feeAmount: 0,
      minReceived: 0,
    });
  });

  it('treats a negative fee as zero', () => {
    const quote = calculateSwapQuote(100, 1, -5, 0);
    expect(quote.feeAmount).toBe(0);
    expect(quote.outputAmount).toBe(100);
  });
});

describe('formatTokenAmount', () => {
  it('trims trailing zeros', () => {
    expect(formatTokenAmount(1.5)).toBe('1.5');
    expect(formatTokenAmount(2)).toBe('2');
  });

  it('returns 0 for non-finite input', () => {
    expect(formatTokenAmount(NaN)).toBe('0');
    expect(formatTokenAmount(Infinity)).toBe('0');
  });
});

describe('clampSlippagePct', () => {
  it('clamps within [MIN_SLIPPAGE_PCT, MAX_SLIPPAGE_PCT]', () => {
    expect(clampSlippagePct(0)).toBe(0.1);
    expect(clampSlippagePct(50)).toBe(10);
    expect(clampSlippagePct(2)).toBe(2);
  });

  it('falls back to the minimum for NaN', () => {
    expect(clampSlippagePct(NaN)).toBe(0.1);
  });
});

describe('TokenSwapRateCalculator', () => {
  const baseProps = {
    fromSymbol: 'XLM',
    toSymbol: 'ARCADE',
    exchangeRate: 2,
    feePercent: 0.3,
    onSwap: vi.fn(),
  };

  it('renders the swap direction title', () => {
    render(<TokenSwapRateCalculator {...baseProps} />);
    expect(screen.getByTestId('tsrc-title').textContent).toContain('XLM → ARCADE');
  });

  it('updates output amount as the input amount changes', () => {
    render(<TokenSwapRateCalculator {...baseProps} />);
    fireEvent.change(screen.getByTestId('tsrc-amount-input'), { target: { value: '100' } });
    expect(screen.getByTestId('tsrc-output-amount').textContent).toBe('199.4');
  });

  it('updates slippage value when a preset is clicked', () => {
    render(<TokenSwapRateCalculator {...baseProps} />);
    fireEvent.click(screen.getByTestId('tsrc-preset-1'));
    expect(screen.getByTestId('tsrc-slippage-value').textContent).toBe('1.0%');
  });

  it('updates slippage value via the range slider', () => {
    render(<TokenSwapRateCalculator {...baseProps} />);
    fireEvent.change(screen.getByTestId('tsrc-slippage-slider'), { target: { value: '3' } });
    expect(screen.getByTestId('tsrc-slippage-value').textContent).toBe('3.0%');
  });

  it('shows a high-slippage warning above the threshold', () => {
    render(<TokenSwapRateCalculator {...baseProps} />);
    expect(screen.queryByTestId('tsrc-high-slippage-warning')).toBeNull();
    fireEvent.change(screen.getByTestId('tsrc-slippage-slider'), { target: { value: '6' } });
    expect(screen.getByTestId('tsrc-high-slippage-warning')).toBeDefined();
  });

  it('disables the swap button when amount is 0', () => {
    render(<TokenSwapRateCalculator {...baseProps} />);
    expect(screen.getByTestId('tsrc-swap-btn')).toHaveProperty('disabled', true);
  });

  it('calls onSwap with amount and slippage when swap is clicked', () => {
    const onSwapMock = vi.fn();
    render(<TokenSwapRateCalculator {...baseProps} onSwap={onSwapMock} />);
    fireEvent.change(screen.getByTestId('tsrc-amount-input'), { target: { value: '50' } });
    fireEvent.click(screen.getByTestId('tsrc-swap-btn'));
    expect(onSwapMock).toHaveBeenCalledWith(50, 0.5);
  });
});
