export interface StakingCalculatorWidgetProps {
  userBalance: number;
  apyRates: Record<number, number>;
  onProceedToStake: (amount: number, days: number) => void;
  className?: string;
  testId?: string;
}

export interface StakingProjection {
  dailyReturn: number;
  monthlyReturn: number;
  maturityReturn: number;
}

export const LOCK_PERIODS = [30, 90, 180, 365] as const;
export type LockPeriod = (typeof LOCK_PERIODS)[number];

export const PRESET_AMOUNTS = [100, 500, 1000] as const;
