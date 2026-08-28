import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import {
  StreakMultiplierWidget,
  getCountdownParts,
  formatCountdown,
  calculateTierProgress,
} from './StreakMultiplierWidget';

describe('getCountdownParts', () => {
  it('breaks down remaining time into hours/minutes/seconds', () => {
    const now = 1_000_000;
    const target = now + (2 * 60 * 60 + 5 * 60 + 30) * 1000; // 2h 5m 30s from now
    const parts = getCountdownParts(target, now);

    expect(parts.hours).toBe(2);
    expect(parts.minutes).toBe(5);
    expect(parts.seconds).toBe(30);
    expect(parts.expired).toBe(false);
  });

  it('reports expired when the target is in the past', () => {
    const now = 1_000_000;
    const parts = getCountdownParts(now - 5000, now);

    expect(parts.expired).toBe(true);
    expect(parts.totalMs).toBe(0);
  });

  it('parses ISO date strings', () => {
    const now = new Date('2026-08-27T00:00:00Z').getTime();
    const target = new Date('2026-08-27T01:30:00Z').toISOString();
    const parts = getCountdownParts(target, now);

    expect(parts.hours).toBe(1);
    expect(parts.minutes).toBe(30);
    expect(parts.expired).toBe(false);
  });

  it('treats null/undefined expiresAt as expired', () => {
    expect(getCountdownParts(null).expired).toBe(true);
    expect(getCountdownParts(undefined).expired).toBe(true);
  });

  it('treats an unparseable string as expired', () => {
    expect(getCountdownParts('not-a-date').expired).toBe(true);
  });
});

describe('formatCountdown', () => {
  it('pads single-digit values with a leading zero', () => {
    expect(formatCountdown({ totalMs: 0, hours: 1, minutes: 2, seconds: 3, expired: false })).toBe('01:02:03');
  });

  it('formats double-digit values without truncation', () => {
    expect(formatCountdown({ totalMs: 0, hours: 12, minutes: 34, seconds: 56, expired: false })).toBe('12:34:56');
  });
});

describe('calculateTierProgress', () => {
  it('computes a proportional percentage toward the next tier', () => {
    expect(calculateTierProgress(3, 10)).toBe(30);
  });

  it('caps progress at 100 when the streak meets or exceeds the tier', () => {
    expect(calculateTierProgress(10, 10)).toBe(100);
    expect(calculateTierProgress(15, 10)).toBe(100);
  });

  it('floors progress at 0 for a negative streak', () => {
    expect(calculateTierProgress(-5, 10)).toBe(0);
  });

  it('returns 100 when nextTierAt is zero or negative to avoid dividing by zero', () => {
    expect(calculateTierProgress(5, 0)).toBe(100);
    expect(calculateTierProgress(5, -1)).toBe(100);
  });
});

describe('StreakMultiplierWidget', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-27T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const futureIso = () => new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(); // 5h from now

  it('renders the active streak count and multiplier', () => {
    render(
      <StreakMultiplierWidget
        currentStreak={7}
        multiplier={1.5}
        nextTierAt={10}
        expiresAt={futureIso()}
      />
    );

    expect(screen.getByTestId('streak-count')).toHaveTextContent('7');
    expect(screen.getByTestId('streak-multiplier')).toHaveTextContent('1.50x');
  });

  it('renders the progress bar and label toward the next tier', () => {
    render(
      <StreakMultiplierWidget
        currentStreak={4}
        multiplier={1.5}
        nextTierAt={10}
        expiresAt={futureIso()}
      />
    );

    expect(screen.getByTestId('streak-progress-label')).toHaveTextContent('4 / 10 to next tier');
    expect(screen.getByTestId('streak-progress-fill')).toHaveStyle({ width: '40%' });
  });

  it('renders the empty state for a zero streak', () => {
    render(
      <StreakMultiplierWidget currentStreak={0} multiplier={1} nextTierAt={7} expiresAt={null} />
    );

    expect(screen.getByTestId('streak-empty-state')).toBeInTheDocument();
    expect(screen.queryByTestId('streak-count')).not.toBeInTheDocument();
  });

  it('renders the empty state for a negative streak value defensively', () => {
    render(
      <StreakMultiplierWidget currentStreak={-1} multiplier={1} nextTierAt={7} expiresAt={null} />
    );

    expect(screen.getByTestId('streak-empty-state')).toBeInTheDocument();
  });

  it('renders the loading fallback and hides the streak content', () => {
    render(
      <StreakMultiplierWidget
        currentStreak={7}
        multiplier={1.5}
        nextTierAt={10}
        expiresAt={futureIso()}
        isLoading
      />
    );

    expect(screen.getByTestId('streak-loading-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('streak-count')).not.toBeInTheDocument();
  });

  it('renders the error fallback with a retry button when onRetry is provided', () => {
    const onRetry = vi.fn();
    render(
      <StreakMultiplierWidget
        currentStreak={7}
        multiplier={1.5}
        nextTierAt={10}
        expiresAt={futureIso()}
        error="Failed to load streak data"
        onRetry={onRetry}
      />
    );

    expect(screen.getByTestId('streak-error-state')).toHaveTextContent('Failed to load streak data');
    fireEvent.click(screen.getByTestId('streak-retry-btn'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('omits the retry button when onRetry is not provided', () => {
    render(
      <StreakMultiplierWidget
        currentStreak={7}
        multiplier={1.5}
        nextTierAt={10}
        expiresAt={futureIso()}
        error="Failed to load streak data"
      />
    );

    expect(screen.queryByTestId('streak-retry-btn')).not.toBeInTheDocument();
  });

  it('applies warning styling when less than 2 hours remain', () => {
    const soon = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1h from now
    render(
      <StreakMultiplierWidget currentStreak={5} multiplier={1.5} nextTierAt={10} expiresAt={soon} />
    );

    expect(screen.getByTestId('streak-countdown')).toHaveClass('streak-multiplier-widget__countdown--warning');
  });

  it('does not apply warning styling when more than 2 hours remain', () => {
    render(
      <StreakMultiplierWidget currentStreak={5} multiplier={1.5} nextTierAt={10} expiresAt={futureIso()} />
    );

    expect(screen.getByTestId('streak-countdown')).not.toHaveClass(
      'streak-multiplier-widget__countdown--warning'
    );
  });

  it('respects a custom warning threshold', () => {
    const soon = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(); // 4h from now
    render(
      <StreakMultiplierWidget
        currentStreak={5}
        multiplier={1.5}
        nextTierAt={10}
        expiresAt={soon}
        expirationWarningThresholdMs={5 * 60 * 60 * 1000} // 5h threshold
      />
    );

    expect(screen.getByTestId('streak-countdown')).toHaveClass('streak-multiplier-widget__countdown--warning');
  });

  it('shows "Streak expired" once the countdown reaches zero', () => {
    const past = new Date(Date.now() - 1000).toISOString();
    render(
      <StreakMultiplierWidget currentStreak={5} multiplier={1.5} nextTierAt={10} expiresAt={past} />
    );

    expect(screen.getByTestId('streak-countdown')).toHaveTextContent('Streak expired');
  });

  it('omits the countdown block entirely when expiresAt is null', () => {
    render(
      <StreakMultiplierWidget currentStreak={5} multiplier={1.5} nextTierAt={10} expiresAt={null} />
    );

    expect(screen.queryByTestId('streak-countdown')).not.toBeInTheDocument();
  });

  it('calls onCheckIn when the check-in button is clicked', async () => {
    const onCheckIn = vi.fn().mockResolvedValue(undefined);
    render(
      <StreakMultiplierWidget
        currentStreak={5}
        multiplier={1.5}
        nextTierAt={10}
        expiresAt={futureIso()}
        onCheckIn={onCheckIn}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('streak-checkin-btn'));
    });

    expect(onCheckIn).toHaveBeenCalledTimes(1);
  });

  it('disables the check-in button while the check-in call is in flight', async () => {
    let resolveCheckIn: () => void = () => {};
    const onCheckIn = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveCheckIn = resolve;
        })
    );

    render(
      <StreakMultiplierWidget
        currentStreak={5}
        multiplier={1.5}
        nextTierAt={10}
        expiresAt={futureIso()}
        onCheckIn={onCheckIn}
      />
    );

    const button = screen.getByTestId('streak-checkin-btn');

    await act(async () => {
      fireEvent.click(button);
    });

    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Checking in…');

    await act(async () => {
      resolveCheckIn();
    });
  });

  it('disables the check-in button after a successful check-in until the streak prop changes', async () => {
    const onCheckIn = vi.fn().mockResolvedValue(undefined);
    render(
      <StreakMultiplierWidget
        currentStreak={5}
        multiplier={1.5}
        nextTierAt={10}
        expiresAt={futureIso()}
        onCheckIn={onCheckIn}
      />
    );

    const button = screen.getByTestId('streak-checkin-btn');

    await act(async () => {
      fireEvent.click(button);
    });

    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Checked In');
  });

  it('re-enables the check-in button once the parent supplies an updated streak count', async () => {
    const onCheckIn = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(
      <StreakMultiplierWidget
        currentStreak={5}
        multiplier={1.5}
        nextTierAt={10}
        expiresAt={futureIso()}
        onCheckIn={onCheckIn}
      />
    );

    const button = screen.getByTestId('streak-checkin-btn');
    await act(async () => {
      fireEvent.click(button);
    });
    expect(button).toBeDisabled();

    rerender(
      <StreakMultiplierWidget
        currentStreak={6}
        multiplier={1.5}
        nextTierAt={10}
        expiresAt={futureIso()}
        onCheckIn={onCheckIn}
      />
    );

    expect(screen.getByTestId('streak-checkin-btn')).not.toBeDisabled();
    expect(screen.getByTestId('streak-checkin-btn')).toHaveTextContent('Check In');
  });

  it('omits the check-in button entirely when onCheckIn is not provided', () => {
    render(
      <StreakMultiplierWidget currentStreak={5} multiplier={1.5} nextTierAt={10} expiresAt={futureIso()} />
    );

    expect(screen.queryByTestId('streak-checkin-btn')).not.toBeInTheDocument();
  });

  it('offers a "Start Streak" check-in action from the empty state', async () => {
    const onCheckIn = vi.fn().mockResolvedValue(undefined);
    render(
      <StreakMultiplierWidget
        currentStreak={0}
        multiplier={1}
        nextTierAt={7}
        expiresAt={null}
        onCheckIn={onCheckIn}
      />
    );

    const button = screen.getByTestId('streak-checkin-btn');
    expect(button).toHaveTextContent('Start Streak');

    await act(async () => {
      fireEvent.click(button);
    });

    expect(onCheckIn).toHaveBeenCalledTimes(1);
  });

  it('applies a custom className and testId', () => {
    render(
      <StreakMultiplierWidget
        currentStreak={5}
        multiplier={1.5}
        nextTierAt={10}
        expiresAt={futureIso()}
        className="extra-class"
        testId="custom-streak"
      />
    );

    expect(screen.getByTestId('custom-streak')).toHaveClass('extra-class');
  });
});
