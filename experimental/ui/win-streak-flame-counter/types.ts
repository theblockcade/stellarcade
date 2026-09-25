export type FlameTier = 'dormant' | 'spark' | 'roar' | 'inferno';

export type FlameSize = 'sm' | 'md' | 'lg';

export interface WinStreakFlameCounterProps {
  streakCount: number;
  multiplier: number;
  showMultiplier?: boolean;
  size?: FlameSize;
  className?: string;
  testId?: string;
}