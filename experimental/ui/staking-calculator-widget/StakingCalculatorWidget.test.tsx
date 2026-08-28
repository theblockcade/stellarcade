import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { StakingCalculatorWidget, calculateProjection, formatUSD, getApyForPeriod } from './StakingCalculatorWidget';

describe('calculateProjection', () => {
  it('returns zeros for zero amount', () => {
    const result = calculateProjection(0, 10, 30);
    expect(result).toEqual({ dailyReturn: 0, monthlyReturn: 0, maturityReturn: 0 });
  });

  it('returns zeros for zero APY', () => {
    const result = calculateProjection(1000, 0, 30);
    expect(result).toEqual({ dailyReturn: 0, monthlyReturn: 0, maturityReturn: 0 });
  });

  it('calculates correct daily return for 10% APY on 1000 tokens', () => {
    const result = calculateProjection(1000, 10, 30);
    // 1000 * 0.10 / 365 = 0.2739...
    expect(result.dailyReturn).toBeCloseTo(0.274, 2);
  });

  it('calculates correct monthly return', () => {
    const result = calculateProjection(1000, 10, 30);
    // dailyReturn * 30
    expect(result.monthlyReturn).toBeCloseTo(result.dailyReturn * 30, 4);
  });

  it('calculates correct maturity return', () => {
    const result = calculateProjection(1000, 20, 365);
    // 1000 * 0.20 * (365/365) = 200
    expect(result.maturityReturn).toBeCloseTo(200, 2);
  });

  it('handles 365-day lock with 20% APY', () => {
    const result = calculateProjection(500, 20, 365);
    expect(result.maturityReturn).toBeCloseTo(100, 2);
  });

  it('handles 30-day lock with 5% APY', () => {
    const result = calculateProjection(1000, 5, 30);
    // 1000 * 0.05 * (30/365) = 4.109...
    expect(result.maturityReturn).toBeCloseTo(4.11, 1);
  });
});

describe('formatUSD', () => {
  it('formats with dollar sign and two decimals', () => {
    expect(formatUSD(4.109)).toBe('$4.11');
  });

  it('formats zero', () => {
    expect(formatUSD(0)).toBe('$0.00');
  });

  it('formats large values', () => {
    expect(formatUSD(1234.56)).toBe('$1234.56');
  });
});

describe('getApyForPeriod', () => {
  const rates: Record<number, number> = { 30: 5, 90: 8, 180: 12, 365: 20 };

  it('returns APY for known period', () => {
    expect(getApyForPeriod(rates, 30)).toBe(5);
    expect(getApyForPeriod(rates, 365)).toBe(20);
  });

  it('returns 0 for unknown period', () => {
    expect(getApyForPeriod(rates, 60)).toBe(0);
  });
});

describe('StakingCalculatorWidget', () => {
  const defaultApyRates: Record<number, number> = { 30: 5, 90: 8, 180: 12, 365: 20 };

  const defaultProps = {
    userBalance: 5000,
    apyRates: defaultApyRates,
    onProceedToStake: vi.fn(),
  };

  it('renders the title', () => {
    render(<StakingCalculatorWidget {...defaultProps} />);
    expect(screen.getByTestId('scw-title')).toHaveTextContent('Staking Calculator');
  });

  it('renders all duration chips with APY labels', () => {
    render(<StakingCalculatorWidget {...defaultProps} />);
    expect(screen.getByTestId('scw-chip-30')).toHaveTextContent('30d');
    expect(screen.getByTestId('scw-chip-30')).toHaveTextContent('5% APY');
    expect(screen.getByTestId('scw-chip-365')).toHaveTextContent('365d');
    expect(screen.getByTestId('scw-chip-365')).toHaveTextContent('20% APY');
  });

  it('defaults to 30d selection', () => {
    render(<StakingCalculatorWidget {...defaultProps} />);
    expect(screen.getByTestId('scw-chip-30').className).toContain('scw-chip--active');
  });

  it('switches active chip on click', () => {
    render(<StakingCalculatorWidget {...defaultProps} />);
    fireEvent.click(screen.getByTestId('scw-chip-365'));
    expect(screen.getByTestId('scw-chip-365').className).toContain('scw-chip--active');
    expect(screen.getByTestId('scw-chip-30').className).not.toContain('scw-chip--active');
  });

  it('populates input when preset button is clicked', () => {
    render(<StakingCalculatorWidget {...defaultProps} />);
    fireEvent.click(screen.getByTestId('scw-preset-500'));
    expect(screen.getByTestId('scw-amount-input')).toHaveValue(500);
  });

  it('populates MAX button with user balance', () => {
    render(<StakingCalculatorWidget {...defaultProps} />);
    fireEvent.click(screen.getByTestId('scw-preset-max'));
    expect(screen.getByTestId('scw-amount-input')).toHaveValue(5000);
  });

  it('updates projection when amount changes', () => {
    render(<StakingCalculatorWidget {...defaultProps} />);
    fireEvent.click(screen.getByTestId('scw-preset-1000'));
    // 30d 5% APY: daily = 1000 * 0.05 / 365 = 0.1369...
    const daily = screen.getByTestId('scw-daily-return');
    expect(daily.textContent).toContain('$0.');
  });

  it('calls onProceedToStake with amount and days on Stake Now click', () => {
    const onProceedToStake = vi.fn();
    render(<StakingCalculatorWidget {...defaultProps} onProceedToStake={onProceedToStake} />);
    fireEvent.click(screen.getByTestId('scw-preset-500'));
    fireEvent.click(screen.getByTestId('scw-stake-btn'));
    expect(onProceedToStake).toHaveBeenCalledWith(500, 30);
  });

  it('passes correct days when duration is changed', () => {
    const onProceedToStake = vi.fn();
    render(<StakingCalculatorWidget {...defaultProps} onProceedToStake={onProceedToStake} />);
    fireEvent.click(screen.getByTestId('scw-preset-100'));
    fireEvent.click(screen.getByTestId('scw-chip-365'));
    fireEvent.click(screen.getByTestId('scw-stake-btn'));
    expect(onProceedToStake).toHaveBeenCalledWith(100, 365);
  });

  it('disables Stake Now when amount is zero', () => {
    render(<StakingCalculatorWidget {...defaultProps} />);
    expect(screen.getByTestId('scw-stake-btn')).toBeDisabled();
  });

  it('enables Stake Now after entering an amount', () => {
    render(<StakingCalculatorWidget {...defaultProps} />);
    fireEvent.click(screen.getByTestId('scw-preset-100'));
    expect(screen.getByTestId('scw-stake-btn')).not.toBeDisabled();
  });
});
