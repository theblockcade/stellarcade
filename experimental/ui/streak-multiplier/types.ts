export type StreakWidgetStatus = 'idle' | 'loading' | 'error';

export interface StreakMultiplierWidgetProps {
  /** Number of consecutive check-ins/wins in the player's current streak. */
  currentStreak: number;
  /** Current payout multiplier applied while this streak is active, e.g. 1.5 for 1.5x. */
  multiplier: number;
  /** Streak count required to reach the next multiplier tier. */
  nextTierAt: number;
  /** ISO timestamp (or epoch ms) at which the current streak expires if no check-in occurs. */
  expiresAt: string | number | null;
  /** Called when the player checks in to extend the streak. Omit to render the widget read-only. */
  onCheckIn?: () => Promise<void> | void;
  /** External loading flag, e.g. while streak data is being fetched. */
  isLoading?: boolean;
  /** External error message; when set, the widget renders an error fallback with a retry affordance. */
  error?: string | null;
  /** Retry callback surfaced from the error fallback state. */
  onRetry?: () => void;
  /** Below this many milliseconds remaining, the countdown switches to warning styling. */
  expirationWarningThresholdMs?: number;
  className?: string;
  testId?: string;
}

export interface CountdownParts {
  totalMs: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}
