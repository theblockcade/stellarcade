import React, { useState, useMemo, useCallback } from 'react';
import type { StakingCalculatorWidgetProps, StakingProjection, LockPeriod } from './types';
import { LOCK_PERIODS, PRESET_AMOUNTS } from './types';
import './StakingCalculatorWidget.css';

/** Calculate staking projections given amount, APY, and lock duration. */
export const calculateProjection = (
  amount: number,
  apyPercent: number,
  lockDays: number,
): StakingProjection => {
  if (amount <= 0 || apyPercent <= 0 || lockDays <= 0) {
    return { dailyReturn: 0, monthlyReturn: 0, maturityReturn: 0 };
  }
  const dailyRate = apyPercent / 100 / 365;
  const dailyReturn = amount * dailyRate;
  const monthlyReturn = dailyReturn * 30;
  const maturityReturn = amount * (apyPercent / 100) * (lockDays / 365);
  return { dailyReturn, monthlyReturn, maturityReturn };
};

/** Format a number as USD currency with 2 decimal places. */
export const formatUSD = (value: number): string => {
  return `$${value.toFixed(2)}`;
};

/** Get the APY rate for a given lock period, returning 0 if not found. */
export const getApyForPeriod = (
  apyRates: Record<number, number>,
  days: number,
): number => {
  return apyRates[days] ?? 0;
};

export const StakingCalculatorWidget: React.FC<StakingCalculatorWidgetProps> = ({
  userBalance,
  apyRates,
  onProceedToStake,
  className = '',
  testId = 'staking-calculator-widget',
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [selectedDays, setSelectedDays] = useState<LockPeriod>(30);

  const currentApy = useMemo(
    () => getApyForPeriod(apyRates, selectedDays),
    [apyRates, selectedDays],
  );

  const projection = useMemo(
    () => calculateProjection(amount, currentApy, selectedDays),
    [amount, currentApy, selectedDays],
  );

  const handlePreset = useCallback((preset: number) => {
    setAmount(preset);
  }, []);

  const handleMax = useCallback(() => {
    setAmount(userBalance);
  }, [userBalance]);

  const handleStake = useCallback(() => {
    if (amount > 0) {
      onProceedToStake(amount, selectedDays);
    }
  }, [amount, selectedDays, onProceedToStake]);

  return (
    <div className={`scw-container ${className}`} data-testid={testId}>
      <h3 className="scw-title" data-testid="scw-title">Staking Calculator</h3>

      {/* Amount input */}
      <div className="scw-section">
        <label className="scw-label" htmlFor="scw-amount-input">Stake Amount</label>
        <div className="scw-input-row">
          <input
            id="scw-amount-input"
            type="number"
            className="scw-input"
            value={amount || ''}
            onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
            placeholder="0.00"
            min={0}
            data-testid="scw-amount-input"
          />
        </div>
        <div className="scw-presets" data-testid="scw-presets">
          {PRESET_AMOUNTS.map((preset) => (
            <button
              key={preset}
              className="scw-preset-btn"
              onClick={() => handlePreset(preset)}
              data-testid={`scw-preset-${preset}`}
            >
              {preset.toLocaleString()}
            </button>
          ))}
          <button
            className="scw-preset-btn scw-preset-max"
            onClick={handleMax}
            data-testid="scw-preset-max"
          >
            MAX
          </button>
        </div>
      </div>

      {/* Duration selection */}
      <div className="scw-section">
        <label className="scw-label">Lock Duration</label>
        <div className="scw-duration-chips" data-testid="scw-duration-chips">
          {LOCK_PERIODS.map((days) => {
            const apy = getApyForPeriod(apyRates, days);
            const isActive = days === selectedDays;
            return (
              <button
                key={days}
                className={`scw-chip ${isActive ? 'scw-chip--active' : ''}`}
                onClick={() => setSelectedDays(days)}
                data-testid={`scw-chip-${days}`}
              >
                <span className="scw-chip-days">{days}d</span>
                <span className="scw-chip-apy">{apy}% APY</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Earnings summary */}
      <div className="scw-section scw-summary" data-testid="scw-summary">
        <div className="scw-summary-row">
          <span className="scw-summary-label">Daily Return</span>
          <span className="scw-summary-value" data-testid="scw-daily-return">
            {formatUSD(projection.dailyReturn)}
          </span>
        </div>
        <div className="scw-summary-row">
          <span className="scw-summary-label">Monthly Return</span>
          <span className="scw-summary-value" data-testid="scw-monthly-return">
            {formatUSD(projection.monthlyReturn)}
          </span>
        </div>
        <div className="scw-summary-row scw-summary-total">
          <span className="scw-summary-label">Total at Maturity ({selectedDays}d)</span>
          <span className="scw-summary-value" data-testid="scw-maturity-return">
            {formatUSD(projection.maturityReturn)}
          </span>
        </div>
      </div>

      {/* Stake button */}
      <button
        className="scw-stake-btn"
        onClick={handleStake}
        disabled={amount <= 0}
        data-testid="scw-stake-btn"
      >
        Stake Now
      </button>
    </div>
  );
};

StakingCalculatorWidget.displayName = 'StakingCalculatorWidget';
export default StakingCalculatorWidget;
