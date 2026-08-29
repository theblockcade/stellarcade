import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import {
  calculatePrizeDistribution,
  formatCountdown,
  LeaderboardPrizeTicker,
} from './LeaderboardPrizeTicker';

describe('LeaderboardPrizeTicker', () => {
  it('formats countdown strings as HH:MM:SS', () => {
    const now = Date.parse('2026-08-29T12:00:00.000Z');
    const target = '2026-08-29T14:05:09.000Z';

    expect(formatCountdown(target, now)).toBe('02:05:09');
  });

  it('renders the prize pool with commas and two decimals', () => {
    render(
      <LeaderboardPrizeTicker
        prizePoolXlm={1500}
        targetResetTs="2026-08-30T00:00:00.000Z"
        topPrizes={[50, 30, 20]}
      />,
    );

    expect(screen.getByText('1,500.00 XLM Pool')).toBeInTheDocument();
  });

  it('renders the current user rank pill when provided', () => {
    render(
      <LeaderboardPrizeTicker
        prizePoolXlm={1500}
        targetResetTs="2026-08-30T00:00:00.000Z"
        userRank={14}
        topPrizes={[50, 30, 20]}
      />,
    );

    expect(screen.getByTestId('leaderboard-prize-ticker-rank')).toHaveTextContent('Your Rank: #14');
  });

  it('calculates top three prize distributions from percentages', () => {
    expect(calculatePrizeDistribution(1500, [50, 30, 20, 10])).toEqual([
      { place: 1, percentage: 50, amountXlm: 750 },
      { place: 2, percentage: 30, amountXlm: 450 },
      { place: 3, percentage: 20, amountXlm: 300 },
    ]);
  });

  it('updates the countdown clock on an interval without rerender state', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-29T23:59:58.000Z'));

    render(
      <LeaderboardPrizeTicker
        prizePoolXlm={1500}
        targetResetTs="2026-08-30T00:00:00.000Z"
        topPrizes={[50, 30, 20]}
      />,
    );

    expect(screen.getByTestId('leaderboard-prize-ticker-clock')).toHaveTextContent('00:00:02');

    vi.advanceTimersByTime(1000);
    expect(screen.getByTestId('leaderboard-prize-ticker-clock')).toHaveTextContent('00:00:01');

    vi.useRealTimers();
  });
});