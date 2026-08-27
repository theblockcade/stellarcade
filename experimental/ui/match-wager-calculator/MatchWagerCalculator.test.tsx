import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  MatchWagerCalculator,
  calculateWager,
  clampWager,
  resolveEffectiveMax,
} from './MatchWagerCalculator';

describe('calculateWager', () => {
  it('computes fee and payout for a standard wager', () => {
    // 10 wager, 2x payout = 20 gross, 2.5% fee (250 bps) = 0.5, payout = 19.5
    const result = calculateWager(10, 250);
    expect(result.wager).toBe(10);
    expect(result.feeAmount).toBeCloseTo(0.5, 5);
    expect(result.payout).toBeCloseTo(19.5, 5);
    expect(result.netProfit).toBeCloseTo(9.5, 5);
  });

  it('computes a zero fee correctly', () => {
    const result = calculateWager(25, 0);
    expect(result.feeAmount).toBe(0);
    expect(result.payout).toBe(50);
    expect(result.netProfit).toBe(25);
  });

  it('handles a 100% fee without going negative', () => {
    const result = calculateWager(10, 10_000);
    expect(result.feeAmount).toBe(20);
    expect(result.payout).toBe(0);
    expect(result.netProfit).toBe(-10);
  });

  it('treats a non-positive wager as zero', () => {
    expect(calculateWager(0, 250)).toEqual({ wager: 0, feeAmount: 0, payout: 0, netProfit: 0 });
    expect(calculateWager(-5, 250)).toEqual({ wager: 0, feeAmount: 0, payout: 0, netProfit: 0 });
  });

  it('treats NaN wager as zero', () => {
    const result = calculateWager(NaN, 250);
    expect(result.wager).toBe(0);
  });
});

describe('clampWager', () => {
  it('clamps a value below the minimum up to the minimum', () => {
    expect(clampWager(1, 5, 100)).toBe(5);
  });

  it('clamps a value above the maximum down to the maximum', () => {
    expect(clampWager(500, 5, 100)).toBe(100);
  });

  it('leaves an in-range value unchanged', () => {
    expect(clampWager(50, 5, 100)).toBe(50);
  });

  it('falls back to minWager for non-finite input', () => {
    expect(clampWager(NaN, 5, 100)).toBe(5);
    expect(clampWager(Infinity, 5, 100)).toBe(5);
  });
});

describe('resolveEffectiveMax', () => {
  it('returns the balance when it is lower than maxWager', () => {
    expect(resolveEffectiveMax(100, 30)).toBe(30);
  });

  it('returns maxWager when balance exceeds it', () => {
    expect(resolveEffectiveMax(100, 500)).toBe(100);
  });

  it('never returns a negative value', () => {
    expect(resolveEffectiveMax(100, -20)).toBe(0);
  });
});

describe('MatchWagerCalculator', () => {
  const defaultProps = {
    availableBalance: 200,
    minWager: 1,
    maxWager: 100,
    feeBasisPoints: 250,
  };

  it('renders with the minimum wager selected initially', () => {
    render(<MatchWagerCalculator {...defaultProps} />);
    expect(screen.getByTestId('wager-input')).toHaveValue(1);
  });

  it('updates the payout summary in real time as the slider moves', () => {
    render(<MatchWagerCalculator {...defaultProps} />);
    const slider = screen.getByTestId('wager-slider');

    fireEvent.change(slider, { target: { value: '20' } });

    expect(screen.getByTestId('summary-wager')).toHaveTextContent('20.00 XLM');
    // 20 * 2 = 40 gross, 2.5% fee = 1, payout = 39
    expect(screen.getByTestId('summary-fee')).toHaveTextContent('1.00 XLM');
    expect(screen.getByTestId('summary-payout')).toHaveTextContent('39.00 XLM');
  });

  it('syncs the wager input value when a quick-select chip is clicked', () => {
    render(<MatchWagerCalculator {...defaultProps} />);

    fireEvent.click(screen.getByTestId('chip-25'));

    expect(screen.getByTestId('wager-input')).toHaveValue(25);
    expect(screen.getByTestId('chip-25')).toHaveClass('match-wager-calculator__chip--active');
  });

  it('marks the matching chip as active after a manual slider change', () => {
    render(<MatchWagerCalculator {...defaultProps} />);
    const slider = screen.getByTestId('wager-slider');

    fireEvent.change(slider, { target: { value: '50' } });

    expect(screen.getByTestId('chip-50')).toHaveClass('match-wager-calculator__chip--active');
  });

  it('selects the balance-capped amount when the MAX chip is clicked', () => {
    render(<MatchWagerCalculator {...defaultProps} availableBalance={40} />);

    fireEvent.click(screen.getByTestId('chip-MAX'));

    // effectiveMax = min(maxWager=100, balance=40) = 40
    expect(screen.getByTestId('wager-input')).toHaveValue(40);
  });

  it('selects the match-rule max when balance exceeds maxWager', () => {
    render(<MatchWagerCalculator {...defaultProps} availableBalance={500} />);

    fireEvent.click(screen.getByTestId('chip-MAX'));

    expect(screen.getByTestId('wager-input')).toHaveValue(100);
  });

  it('calls onWagerSelect with the selected wager and token', () => {
    const onWagerSelect = vi.fn();
    render(<MatchWagerCalculator {...defaultProps} onWagerSelect={onWagerSelect} />);

    fireEvent.click(screen.getByTestId('chip-10'));

    expect(onWagerSelect).toHaveBeenCalledWith(10, 'XLM');
  });

  it('shows an insufficient-balance error when balance is below minWager', () => {
    render(<MatchWagerCalculator {...defaultProps} availableBalance={0.5} minWager={1} />);

    expect(screen.getByTestId('insufficient-balance-error')).toBeInTheDocument();
    expect(screen.getByTestId('wager-slider')).toBeDisabled();
  });

  it('shows an exceeds-balance error when the typed wager is above the balance', () => {
    render(<MatchWagerCalculator {...defaultProps} availableBalance={15} maxWager={100} />);
    const input = screen.getByTestId('wager-input');

    fireEvent.change(input, { target: { value: '20' } });
    fireEvent.blur(input);

    expect(screen.getByTestId('exceeds-balance-error')).toBeInTheDocument();
  });

  it('does not show a balance error for a valid in-range wager', () => {
    render(<MatchWagerCalculator {...defaultProps} availableBalance={200} />);

    expect(screen.queryByTestId('insufficient-balance-error')).not.toBeInTheDocument();
    expect(screen.queryByTestId('exceeds-balance-error')).not.toBeInTheDocument();
  });

  it('clamps a typed value above maxWager down to maxWager on blur', () => {
    render(<MatchWagerCalculator {...defaultProps} maxWager={50} />);
    const input = screen.getByTestId('wager-input');

    fireEvent.change(input, { target: { value: '9999' } });
    fireEvent.blur(input);

    expect(input).toHaveValue(50);
  });

  it('clamps a typed value below minWager up to minWager on blur', () => {
    render(<MatchWagerCalculator {...defaultProps} minWager={5} />);
    const input = screen.getByTestId('wager-input');

    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.blur(input);

    expect(input).toHaveValue(5);
  });

  it('falls back to minWager when the input is cleared', () => {
    render(<MatchWagerCalculator {...defaultProps} minWager={2} />);
    const input = screen.getByTestId('wager-input');

    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);

    expect(input).toHaveValue(2);
  });

  it('commits the input value when Enter is pressed and the field loses focus', () => {
    render(<MatchWagerCalculator {...defaultProps} />);
    const input = screen.getByTestId('wager-input');

    fireEvent.change(input, { target: { value: '15' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    // jsdom does not automatically dispatch a native blur event as a side
    // effect of a programmatic element.blur() call made from inside another
    // event handler, so simulate the resulting blur explicitly here.
    fireEvent.blur(input);

    expect(screen.getByTestId('summary-wager')).toHaveTextContent('15.00 XLM');
  });

  it('renders the multi-token toggle by default and switches token', () => {
    const onWagerSelect = vi.fn();
    render(<MatchWagerCalculator {...defaultProps} onWagerSelect={onWagerSelect} />);

    expect(screen.getByTestId('token-toggle-ARCADE')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('token-toggle-ARCADE'));

    expect(screen.getByTestId('token-toggle-ARCADE')).toHaveAttribute('aria-selected', 'true');
    expect(onWagerSelect).toHaveBeenCalledWith(expect.any(Number), 'ARCADE');
  });

  it('hides the token toggle when multiToken is false', () => {
    render(<MatchWagerCalculator {...defaultProps} multiToken={false} />);
    expect(screen.queryByTestId('token-toggle-XLM')).not.toBeInTheDocument();
  });

  it('computes negative net profit correctly when fee exceeds matched winnings', () => {
    render(<MatchWagerCalculator {...defaultProps} feeBasisPoints={9000} />);
    fireEvent.click(screen.getByTestId('chip-10'));

    const netProfit = screen.getByTestId('summary-net-profit');
    expect(netProfit).toHaveClass('match-wager-calculator__profit-negative');
  });

  it('applies a custom className and testId', () => {
    render(<MatchWagerCalculator {...defaultProps} className="extra-class" testId="custom-wager" />);
    const root = screen.getByTestId('custom-wager');
    expect(root).toHaveClass('extra-class');
  });
});
