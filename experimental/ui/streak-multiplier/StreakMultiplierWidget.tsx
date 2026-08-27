import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { StreakMultiplierWidgetProps, CountdownParts } from './types';
import './StreakMultiplierWidget.css';

const DEFAULT_WARNING_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours

/** Parses `expiresAt` (ISO string, epoch ms, or null) into a millisecond timestamp, or null. */
const toTimestamp = (expiresAt: string | number | null | undefined): number | null => {
  if (expiresAt === null || expiresAt === undefined) return null;
  if (typeof expiresAt === 'number') return expiresAt;
  const parsed = Date.parse(expiresAt);
  return Number.isNaN(parsed) ? null : parsed;
};

/** Breaks the remaining time until `expiresAt` into hours/minutes/seconds, clamped at zero. */
export const getCountdownParts = (
  expiresAt: string | number | null | undefined,
  now: number = Date.now()
): CountdownParts => {
  const target = toTimestamp(expiresAt);
  if (target === null) {
    return { totalMs: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  const totalMs = Math.max(0, target - now);
  const hours = Math.floor(totalMs / (60 * 60 * 1000));
  const minutes = Math.floor((totalMs % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((totalMs % (60 * 1000)) / 1000);

  return { totalMs, hours, minutes, seconds, expired: totalMs <= 0 };
};

/** Formats countdown parts as `HH:MM:SS`. */
export const formatCountdown = (parts: CountdownParts): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(parts.hours)}:${pad(parts.minutes)}:${pad(parts.seconds)}`;
};

/**
 * Computes progress (0-100) toward `nextTierAt` from `currentStreak`.
 * Returns 100 when the streak has already reached or passed the next tier.
 */
export const calculateTierProgress = (currentStreak: number, nextTierAt: number): number => {
  if (nextTierAt <= 0) return 100;
  const pct = (currentStreak / nextTierAt) * 100;
  return Math.min(100, Math.max(0, pct));
};

export const StreakMultiplierWidget: React.FC<StreakMultiplierWidgetProps> = ({
  currentStreak,
  multiplier,
  nextTierAt,
  expiresAt,
  onCheckIn,
  isLoading = false,
  error = null,
  onRetry,
  expirationWarningThresholdMs = DEFAULT_WARNING_THRESHOLD_MS,
  className = '',
  testId = 'streak-multiplier-widget',
}) => {
  const [now, setNow] = useState<number>(() => Date.now());
  const [checkingIn, setCheckingIn] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState(false);
  const lastStreakRef = useRef(currentStreak);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Once the parent reports a new streak count (e.g. after a successful
  // check-in round-trips through fresh props), release the "already
  // checked in" lock so the button becomes actionable again on the next cycle.
  useEffect(() => {
    if (currentStreak !== lastStreakRef.current) {
      lastStreakRef.current = currentStreak;
      setJustCheckedIn(false);
    }
  }, [currentStreak]);

  const countdown = useMemo(() => getCountdownParts(expiresAt, now), [expiresAt, now]);
  const isWarning = !countdown.expired && countdown.totalMs > 0 && countdown.totalMs < expirationWarningThresholdMs;
  const tierProgress = useMemo(() => calculateTierProgress(currentStreak, nextTierAt), [currentStreak, nextTierAt]);
  const isNewUser = currentStreak <= 0;

  const handleCheckIn = useCallback(async () => {
    if (!onCheckIn || checkingIn || justCheckedIn) return;
    setCheckingIn(true);
    try {
      await onCheckIn();
      setJustCheckedIn(true);
    } finally {
      setCheckingIn(false);
    }
  }, [onCheckIn, checkingIn, justCheckedIn]);

  if (isLoading) {
    return (
      <div className={`streak-multiplier-widget streak-multiplier-widget--loading ${className}`} data-testid={testId}>
        <div className="streak-multiplier-widget__skeleton" data-testid="streak-loading-skeleton">
          <div className="streak-multiplier-widget__skeleton-line streak-multiplier-widget__skeleton-line--wide" />
          <div className="streak-multiplier-widget__skeleton-line" />
          <div className="streak-multiplier-widget__skeleton-bar" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`streak-multiplier-widget streak-multiplier-widget--error ${className}`} data-testid={testId}>
        <div className="streak-multiplier-widget__error" role="alert" data-testid="streak-error-state">
          <p className="streak-multiplier-widget__error-message">{error}</p>
          {onRetry && (
            <button
              type="button"
              className="streak-multiplier-widget__retry-btn"
              onClick={onRetry}
              data-testid="streak-retry-btn"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isNewUser) {
    return (
      <div className={`streak-multiplier-widget streak-multiplier-widget--empty ${className}`} data-testid={testId}>
        <div className="streak-multiplier-widget__empty" data-testid="streak-empty-state">
          <p className="streak-multiplier-widget__empty-title">No active streak yet</p>
          <p className="streak-multiplier-widget__empty-subtitle">
            Check in after a match to start building your multiplier.
          </p>
          {onCheckIn && (
            <button
              type="button"
              className="streak-multiplier-widget__checkin-btn"
              onClick={handleCheckIn}
              disabled={checkingIn || justCheckedIn}
              data-testid="streak-checkin-btn"
            >
              {checkingIn ? 'Checking in…' : 'Start Streak'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`streak-multiplier-widget ${className}`} data-testid={testId}>
      <div className="streak-multiplier-widget__header">
        <div className="streak-multiplier-widget__streak-count" data-testid="streak-count">
          <span className="streak-multiplier-widget__streak-icon" aria-hidden="true">
            🔥
          </span>
          <span>{currentStreak}</span>
          <span className="streak-multiplier-widget__streak-label">day streak</span>
        </div>
        <div className="streak-multiplier-widget__multiplier" data-testid="streak-multiplier">
          {multiplier.toFixed(2)}x
        </div>
      </div>

      <div className="streak-multiplier-widget__progress-row">
        <div
          className="streak-multiplier-widget__progress-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={nextTierAt}
          aria-valuenow={Math.min(currentStreak, nextTierAt)}
          data-testid="streak-progress-bar"
        >
          <div
            className="streak-multiplier-widget__progress-fill"
            style={{ width: `${tierProgress}%` }}
            data-testid="streak-progress-fill"
          />
        </div>
        <span className="streak-multiplier-widget__progress-label" data-testid="streak-progress-label">
          {Math.min(currentStreak, nextTierAt)} / {nextTierAt} to next tier
        </span>
      </div>

      {expiresAt !== null && expiresAt !== undefined && (
        <div
          className={`streak-multiplier-widget__countdown ${
            isWarning ? 'streak-multiplier-widget__countdown--warning' : ''
          }`}
          data-testid="streak-countdown"
        >
          <span className="streak-multiplier-widget__countdown-label">
            {countdown.expired ? 'Streak expired' : 'Expires in'}
          </span>
          {!countdown.expired && (
            <span className="streak-multiplier-widget__countdown-value" data-testid="streak-countdown-value">
              {formatCountdown(countdown)}
            </span>
          )}
        </div>
      )}

      {onCheckIn && (
        <button
          type="button"
          className="streak-multiplier-widget__checkin-btn"
          onClick={handleCheckIn}
          disabled={checkingIn || justCheckedIn}
          data-testid="streak-checkin-btn"
        >
          {checkingIn ? 'Checking in…' : justCheckedIn ? 'Checked In' : 'Check In'}
        </button>
      )}
    </div>
  );
};

StreakMultiplierWidget.displayName = 'StreakMultiplierWidget';
export default StreakMultiplierWidget;
