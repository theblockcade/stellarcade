export interface TokenSwapRateCalculatorProps {
  fromSymbol: string;
  toSymbol: string;
  /** Units of `toSymbol` received per 1 unit of `fromSymbol`, before fees. */
  exchangeRate: number;
  /** Pool/protocol fee taken out of the swap, as a percent (e.g. 0.3 for 0.3%). */
  feePercent: number;
  onSwap: (amount: number, slippagePct: number) => void;
  className?: string;
  testId?: string;
}

export interface SwapQuote {
  outputAmount: number;
  feeAmount: number;
  minReceived: number;
}

export const SLIPPAGE_PRESETS: number[] = [0.1, 0.5, 1.0];
export const MIN_SLIPPAGE_PCT = 0.1;
export const MAX_SLIPPAGE_PCT = 10;
export const SLIPPAGE_STEP_PCT = 0.1;
export const HIGH_SLIPPAGE_WARNING_THRESHOLD_PCT = 5;
