import React, { useState, useMemo, useCallback } from 'react';
import type { TokenSwapRateCalculatorProps, SwapQuote } from './types';
import {
  SLIPPAGE_PRESETS,
  MIN_SLIPPAGE_PCT,
  MAX_SLIPPAGE_PCT,
  SLIPPAGE_STEP_PCT,
  HIGH_SLIPPAGE_WARNING_THRESHOLD_PCT,
} from './types';
import './TokenSwapRateCalculator.css';

/** Calculate the swap output, fee taken, and minimum received after slippage. */
export const calculateSwapQuote = (
  amount: number,
  exchangeRate: number,
  feePercent: number,
  slippagePct: number,
): SwapQuote => {
  if (amount <= 0 || exchangeRate <= 0) {
    return { outputAmount: 0, feeAmount: 0, minReceived: 0 };
  }
  const grossOutput = amount * exchangeRate;
  const feeAmount = grossOutput * (Math.max(feePercent, 0) / 100);
  const outputAmount = grossOutput - feeAmount;
  const minReceived = outputAmount * (1 - Math.max(slippagePct, 0) / 100);
  return { outputAmount, feeAmount, minReceived };
};

/** Format a token amount to 6 decimal places, trimming trailing zeros. */
export const formatTokenAmount = (value: number): string => {
  if (!Number.isFinite(value)) return '0';
  return value
    .toFixed(6)
    .replace(/0+$/, '')
    .replace(/\.$/, '');
};

/** Clamp a slippage percentage into the allowed [MIN, MAX] range. */
export const clampSlippagePct = (value: number): number => {
  if (Number.isNaN(value)) return MIN_SLIPPAGE_PCT;
  return Math.min(MAX_SLIPPAGE_PCT, Math.max(MIN_SLIPPAGE_PCT, value));
};

export const TokenSwapRateCalculator: React.FC<TokenSwapRateCalculatorProps> = ({
  fromSymbol,
  toSymbol,
  exchangeRate,
  feePercent,
  onSwap,
  className = '',
  testId = 'token-swap-rate-calculator',
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [slippagePct, setSlippagePct] = useState<number>(0.5);

  const quote = useMemo(
    () => calculateSwapQuote(amount, exchangeRate, feePercent, slippagePct),
    [amount, exchangeRate, feePercent, slippagePct],
  );

  const isHighSlippage = slippagePct >= HIGH_SLIPPAGE_WARNING_THRESHOLD_PCT;

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(Math.max(0, parseFloat(e.target.value) || 0));
  }, []);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSlippagePct(clampSlippagePct(parseFloat(e.target.value)));
  }, []);

  const handleSwap = useCallback(() => {
    if (amount > 0) {
      onSwap(amount, slippagePct);
    }
  }, [amount, slippagePct, onSwap]);

  return (
    <div className={`tsrc-container ${className}`} data-testid={testId}>
      <h3 className="tsrc-title" data-testid="tsrc-title">
        Swap {fromSymbol} → {toSymbol}
      </h3>

      <div className="tsrc-section">
        <label className="tsrc-label" htmlFor="tsrc-amount-input">
          You Pay ({fromSymbol})
        </label>
        <input
          id="tsrc-amount-input"
          type="number"
          className="tsrc-input"
          value={amount || ''}
          onChange={handleAmountChange}
          placeholder="0.00"
          min={0}
          data-testid="tsrc-amount-input"
        />
      </div>

      <div className="tsrc-rate-row" data-testid="tsrc-rate-row">
        <span>1 {fromSymbol} = {formatTokenAmount(exchangeRate)} {toSymbol}</span>
      </div>

      <div className="tsrc-section">
        <label className="tsrc-label">You Receive ({toSymbol})</label>
        <div className="tsrc-output" data-testid="tsrc-output-amount">
          {formatTokenAmount(quote.outputAmount)}
        </div>
      </div>

      <div className="tsrc-section">
        <div className="tsrc-slippage-header">
          <label className="tsrc-label" htmlFor="tsrc-slippage-slider">
            Slippage Tolerance
          </label>
          <span
            className={`tsrc-slippage-value ${isHighSlippage ? 'tsrc-slippage-value--high' : ''}`}
            data-testid="tsrc-slippage-value"
          >
            {slippagePct.toFixed(1)}%
          </span>
        </div>
        <input
          id="tsrc-slippage-slider"
          type="range"
          className="tsrc-slider"
          min={MIN_SLIPPAGE_PCT}
          max={MAX_SLIPPAGE_PCT}
          step={SLIPPAGE_STEP_PCT}
          value={slippagePct}
          onChange={handleSliderChange}
          data-testid="tsrc-slippage-slider"
        />
        <div className="tsrc-slippage-presets" data-testid="tsrc-slippage-presets">
          {SLIPPAGE_PRESETS.map((preset) => (
            <button
              key={preset}
              className={`tsrc-preset-btn ${slippagePct === preset ? 'tsrc-preset-btn--active' : ''}`}
              onClick={() => setSlippagePct(preset)}
              data-testid={`tsrc-preset-${preset}`}
            >
              {preset}%
            </button>
          ))}
        </div>
        {isHighSlippage && (
          <p className="tsrc-warning" data-testid="tsrc-high-slippage-warning">
            High slippage tolerance — your swap may be frontrun for a worse price.
          </p>
        )}
      </div>

      <div className="tsrc-section tsrc-summary" data-testid="tsrc-summary">
        <div className="tsrc-summary-row">
          <span className="tsrc-summary-label">Fee ({feePercent}%)</span>
          <span className="tsrc-summary-value" data-testid="tsrc-fee-amount">
            {formatTokenAmount(quote.feeAmount)} {toSymbol}
          </span>
        </div>
        <div className="tsrc-summary-row tsrc-summary-total">
          <span className="tsrc-summary-label">Minimum Received</span>
          <span className="tsrc-summary-value" data-testid="tsrc-min-received">
            {formatTokenAmount(quote.minReceived)} {toSymbol}
          </span>
        </div>
      </div>

      <button
        className="tsrc-swap-btn"
        onClick={handleSwap}
        disabled={amount <= 0}
        data-testid="tsrc-swap-btn"
      >
        Swap Now
      </button>
    </div>
  );
};

TokenSwapRateCalculator.displayName = 'TokenSwapRateCalculator';
export default TokenSwapRateCalculator;
