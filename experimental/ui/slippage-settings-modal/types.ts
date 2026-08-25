export type FeeTier = 'base' | 'fast' | 'custom';

export interface TxSettings {
  feeTier: FeeTier;
  customFeeStroops?: number;
  slippageTolerancePct: number;
  deadlineMinutes: number;
}

export const DEFAULT_TX_SETTINGS: TxSettings = {
  feeTier: 'base',
  slippageTolerancePct: 0.5,
  deadlineMinutes: 10,
};

export const SLIPPAGE_PRESETS: number[] = [0.1, 0.5, 1.0];

export const DEADLINE_OPTIONS: number[] = [5, 10, 20];

export const MIN_SLIPPAGE_PCT = 0;
export const MAX_SLIPPAGE_PCT = 50;
export const HIGH_SLIPPAGE_WARNING_THRESHOLD_PCT = 5;

export const BASE_FEE_STROOPS = 100;
export const FAST_FEE_MULTIPLIER = 1.5;
export const MIN_CUSTOM_FEE_STROOPS = 100;
export const MAX_CUSTOM_FEE_STROOPS = 10_000_000;

export interface ValidationErrors {
  slippage?: string;
  customFee?: string;
}

export interface SlippageSettingsModalProps {
  isOpen: boolean;
  initialSettings: TxSettings;
  onSave: (settings: TxSettings) => void;
  onClose: () => void;
  className?: string;
  testId?: string;
}
