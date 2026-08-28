import React, { useState, useMemo, useCallback } from 'react';
import { MatchWagerCalculatorProps, QuickSelectChip, WagerCalculation, WagerToken } from './types';
import './MatchWagerCalculator.css';

const QUICK_SELECT_VALUES: QuickSelectChip[] = [
  { label: '5', value: 5 },
  { label: '10', value: 10 },
  { label: '25', value: 25 },
  { label: '50', value: 50 },
  { label: 'MAX', value: 'MAX' },
];

/**
 * Computes the platform fee, payout, and net profit for a given wager.
 * Fee is charged in basis points (1/100th of a percent) against the wager.
 * Payout is a straightforward 2x-on-win model minus the fee: the wagered
 * amount is returned plus a matched amount from the opponent's wager, with
 * the platform fee deducted from the total payout.
 */
export const calculateWager = (wager: number, feeBasisPoints: number): WagerCalculation => {
  const safeWager = Number.isFinite(wager) && wager > 0 ? wager : 0;
  const grossPayout = safeWager * 2;
  const feeAmount = (grossPayout * feeBasisPoints) / 10_000;
  const payout = Math.max(0, grossPayout - feeAmount);
  const netProfit = payout - safeWager;

  return {
    wager: safeWager,
    feeAmount,
    payout,
    netProfit,
  };
};

/** Clamps a wager into the [minWager, maxWager] range allowed by match rules. */
export const clampWager = (value: number, minWager: number, maxWager: number): number => {
  if (!Number.isFinite(value)) return minWager;
  return Math.min(maxWager, Math.max(minWager, value));
};

/** Resolves the effective maximum a player can wager: the lower of maxWager and their balance. */
export const resolveEffectiveMax = (maxWager: number, availableBalance: number): number => {
  return Math.max(0, Math.min(maxWager, availableBalance));
};

const formatAmount = (value: number): string =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 7 });

export const MatchWagerCalculator: React.FC<MatchWagerCalculatorProps> = ({
  availableBalance,
  minWager,
  maxWager,
  feeBasisPoints,
  onWagerSelect,
  multiToken = true,
  initialToken = 'XLM',
  className = '',
  testId = 'match-wager-calculator',
}) => {
  const effectiveMax = resolveEffectiveMax(maxWager, availableBalance);
  const initialWager = clampWager(minWager, minWager, Math.max(minWager, effectiveMax));

  const [token, setToken] = useState<WagerToken>(initialToken);
  const [wager, setWager] = useState<number>(initialWager);
  const [rawInput, setRawInput] = useState<string>(String(initialWager));

  const insufficientBalance = availableBalance < minWager;
  const exceedsBalance = wager > availableBalance;

  const calculation = useMemo(() => calculateWager(wager, feeBasisPoints), [wager, feeBasisPoints]);

  const commitWager = useCallback(
    (value: number) => {
      const clamped = clampWager(value, minWager, Math.max(minWager, maxWager));
      setWager(clamped);
      setRawInput(String(clamped));
      onWagerSelect?.(clamped, token);
    },
    [minWager, maxWager, onWagerSelect, token]
  );

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    setWager(value);
    setRawInput(String(value));
    onWagerSelect?.(value, token);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRawInput(event.target.value);
  };

  const handleInputBlur = () => {
    const parsed = Number(rawInput);
    if (rawInput.trim() === '' || Number.isNaN(parsed)) {
      commitWager(minWager);
      return;
    }
    commitWager(parsed);
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    }
  };

  const handleChipSelect = (chip: QuickSelectChip) => {
    const target = chip.value === 'MAX' ? effectiveMax : chip.value;
    commitWager(target);
  };

  const handleTokenToggle = (nextToken: WagerToken) => {
    if (nextToken === token) return;
    setToken(nextToken);
    onWagerSelect?.(wager, nextToken);
  };

  const isChipActive = (chip: QuickSelectChip): boolean => {
    const target = chip.value === 'MAX' ? effectiveMax : chip.value;
    return Math.abs(target - wager) < 0.0000001;
  };

  return (
    <div className={`match-wager-calculator ${className}`} data-testid={testId}>
      {multiToken && (
        <div className="match-wager-calculator__token-toggle" role="tablist" aria-label="Select wager token">
          {(['XLM', 'ARCADE'] as WagerToken[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={token === t}
              className={`match-wager-calculator__token-btn ${
                token === t ? 'match-wager-calculator__token-btn--active' : ''
              }`}
              onClick={() => handleTokenToggle(t)}
              data-testid={`token-toggle-${t}`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <div className="match-wager-calculator__balance-row">
        <span className="match-wager-calculator__balance-label">Available Balance</span>
        <span className="match-wager-calculator__balance-value" data-testid="available-balance">
          {formatAmount(availableBalance)} {token}
        </span>
      </div>

      <div className="match-wager-calculator__input-row">
        <label htmlFor={`${testId}-input`} className="match-wager-calculator__input-label">
          Wager Amount
        </label>
        <input
          id={`${testId}-input`}
          type="number"
          className="match-wager-calculator__input"
          value={rawInput}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          min={minWager}
          max={maxWager}
          step="0.01"
          data-testid="wager-input"
          aria-invalid={exceedsBalance || insufficientBalance}
        />
        <span className="match-wager-calculator__input-suffix">{token}</span>
      </div>

      <input
        type="range"
        className="match-wager-calculator__slider"
        min={minWager}
        max={Math.max(minWager, maxWager)}
        step="0.01"
        value={Math.min(wager, Math.max(minWager, maxWager))}
        onChange={handleSliderChange}
        data-testid="wager-slider"
        aria-label="Wager amount slider"
        disabled={insufficientBalance}
      />

      <div className="match-wager-calculator__chips" data-testid="quick-select-chips">
        {QUICK_SELECT_VALUES.map((chip) => (
          <button
            key={chip.label}
            type="button"
            className={`match-wager-calculator__chip ${
              isChipActive(chip) ? 'match-wager-calculator__chip--active' : ''
            }`}
            onClick={() => handleChipSelect(chip)}
            disabled={insufficientBalance}
            data-testid={`chip-${chip.label}`}
          >
            {chip.value === 'MAX' ? 'MAX' : `${chip.label} ${token}`}
          </button>
        ))}
      </div>

      {insufficientBalance && (
        <div className="match-wager-calculator__error" role="alert" data-testid="insufficient-balance-error">
          Balance is below the minimum wager of {formatAmount(minWager)} {token}.
        </div>
      )}
      {!insufficientBalance && exceedsBalance && (
        <div className="match-wager-calculator__error" role="alert" data-testid="exceeds-balance-error">
          Wager exceeds your available balance.
        </div>
      )}

      <div className="match-wager-calculator__summary" data-testid="payout-summary">
        <div className="match-wager-calculator__summary-row">
          <span>Wager</span>
          <span data-testid="summary-wager">{formatAmount(calculation.wager)} {token}</span>
        </div>
        <div className="match-wager-calculator__summary-row">
          <span>Platform Fee ({(feeBasisPoints / 100).toFixed(2)}%)</span>
          <span data-testid="summary-fee">{formatAmount(calculation.feeAmount)} {token}</span>
        </div>
        <div className="match-wager-calculator__summary-row match-wager-calculator__summary-row--total">
          <span>Estimated Payout on Win</span>
          <span data-testid="summary-payout">{formatAmount(calculation.payout)} {token}</span>
        </div>
        <div className="match-wager-calculator__summary-row">
          <span>Net Profit</span>
          <span
            data-testid="summary-net-profit"
            className={calculation.netProfit >= 0 ? 'match-wager-calculator__profit-positive' : 'match-wager-calculator__profit-negative'}
          >
            {calculation.netProfit >= 0 ? '+' : ''}
            {formatAmount(calculation.netProfit)} {token}
          </span>
        </div>
      </div>
    </div>
  );
};

MatchWagerCalculator.displayName = 'MatchWagerCalculator';
export default MatchWagerCalculator;
