import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { LeaderboardRankDelta } from './LeaderboardRankDelta';
import type { RankHistoryPoint } from './types';

describe('LeaderboardRankDelta', () => {
  it('renders positive rank delta with green upward styling', () => {
    render(
      <LeaderboardRankDelta
        currentRank={5}
        previousRank={8}
      />
    );

    const delta = screen.getByTestId('leaderboard-rank-delta');
    expect(delta).toHaveClass('leaderboard-rank-delta__up');
    expect(delta).toHaveTextContent(/↑ \+3/);
  });

  it('renders negative rank delta with red downward styling', () => {
    render(
      <LeaderboardRankDelta
        currentRank={10}
        previousRank={7}
      />
    );

    const delta = screen.getByTestId('leaderboard-rank-delta');
    expect(delta).toHaveClass('leaderboard-rank-delta__down');
    expect(delta).toHaveTextContent(/↓ -3/);
  });

  it('renders zero delta with neutral styling', () => {
    render(
      <LeaderboardRankDelta
        currentRank={5}
        previousRank={5}
      />
    );

    const delta = screen.getByTestId('leaderboard-rank-delta');
    expect(delta).toHaveClass('leaderboard-rank-delta__neutral');
    expect(delta).toHaveTextContent('−');
  });

  it('renders new entry for null previous rank', () => {
    render(
      <LeaderboardRankDelta
        currentRank={3}
        previousRank={null}
      />
    );

    const delta = screen.getByTestId('leaderboard-rank-delta');
    expect(delta).toHaveTextContent('NEW');
  });

  it('applies top three styling for ranks 1-3', () => {
    render(
      <LeaderboardRankDelta
        currentRank={2}
        previousRank={5}
      />
    );

    const delta = screen.getByTestId('leaderboard-rank-delta');
    expect(delta).toHaveClass('leaderboard-rank-delta--top-three');
  });

  it('does not apply top three styling for ranks above 3', () => {
    render(
      <LeaderboardRankDelta
        currentRank={4}
        previousRank={7}
      />
    );

    const delta = screen.getByTestId('leaderboard-rank-delta');
    expect(delta).not.toHaveClass('leaderboard-rank-delta--top-three');
  });

  it('shows tooltip on hover when history is provided', () => {
    const history: RankHistoryPoint[] = [
      { date: '2026-08-17', rank: 10 },
      { date: '2026-08-18', rank: 8 },
      { date: '2026-08-19', rank: 6 },
      { date: '2026-08-20', rank: 5 },
      { date: '2026-08-21', rank: 4 },
      { date: '2026-08-22', rank: 3 },
      { date: '2026-08-23', rank: 2 },
    ];

    render(
      <LeaderboardRankDelta
        currentRank={2}
        previousRank={5}
        history={history}
      />
    );

    const delta = screen.getByTestId('leaderboard-rank-delta');
    fireEvent.mouseEnter(delta);

    const tooltip = delta.querySelector('.leaderboard-rank-delta__tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('7-Day History');
  });

  it('hides tooltip on mouse leave', () => {
    const history: RankHistoryPoint[] = [
      { date: '2026-08-17', rank: 10 },
      { date: '2026-08-18', rank: 8 },
    ];

    render(
      <LeaderboardRankDelta
        currentRank={5}
        previousRank={8}
        history={history}
      />
    );

    const delta = screen.getByTestId('leaderboard-rank-delta');
    fireEvent.mouseEnter(delta);
    fireEvent.mouseLeave(delta);

    const tooltip = delta.querySelector('.leaderboard-rank-delta__tooltip');
    expect(tooltip).not.toBeInTheDocument();
  });

  it('does not show tooltip when history is not provided', () => {
    render(
      <LeaderboardRankDelta
        currentRank={5}
        previousRank={8}
      />
    );

    const delta = screen.getByTestId('leaderboard-rank-delta');
    fireEvent.mouseEnter(delta);

    const tooltip = delta.querySelector('.leaderboard-rank-delta__tooltip');
    expect(tooltip).not.toBeInTheDocument();
  });

  it('renders correct aria-label for positive delta', () => {
    render(
      <LeaderboardRankDelta
        currentRank={5}
        previousRank={8}
      />
    );

    const delta = screen.getByTestId('leaderboard-rank-delta');
    expect(delta).toHaveAttribute('aria-label', 'Rank increased by 3 positions to 5');
  });

  it('renders correct aria-label for negative delta', () => {
    render(
      <LeaderboardRankDelta
        currentRank={10}
        previousRank={7}
      />
    );

    const delta = screen.getByTestId('leaderboard-rank-delta');
    expect(delta).toHaveAttribute('aria-label', 'Rank decreased by 3 positions to 10');
  });

  it('renders correct aria-label for zero delta', () => {
    render(
      <LeaderboardRankDelta
        currentRank={5}
        previousRank={5}
      />
    );

    const delta = screen.getByTestId('leaderboard-rank-delta');
    expect(delta).toHaveAttribute('aria-label', 'Rank unchanged at 5');
  });

  it('renders correct aria-label for new entry', () => {
    render(
      <LeaderboardRankDelta
        currentRank={3}
        previousRank={null}
      />
    );

    const delta = screen.getByTestId('leaderboard-rank-delta');
    expect(delta).toHaveAttribute('aria-label', 'New entry at rank 3');
  });

  it('applies size classes correctly', () => {
    const { rerender } = render(
      <LeaderboardRankDelta
        currentRank={5}
        previousRank={8}
        size="sm"
      />
    );

    let delta = screen.getByTestId('leaderboard-rank-delta');
    expect(delta).toHaveClass('leaderboard-rank-delta--sm');

    rerender(
      <LeaderboardRankDelta
        currentRank={5}
        previousRank={8}
        size="md"
      />
    );

    delta = screen.getByTestId('leaderboard-rank-delta');
    expect(delta).toHaveClass('leaderboard-rank-delta--md');

    rerender(
      <LeaderboardRankDelta
        currentRank={5}
        previousRank={8}
        size="lg"
      />
    );

    delta = screen.getByTestId('leaderboard-rank-delta');
    expect(delta).toHaveClass('leaderboard-rank-delta--lg');
  });

  it('applies custom className', () => {
    render(
      <LeaderboardRankDelta
        currentRank={5}
        previousRank={8}
        className="custom-class"
      />
    );

    const delta = screen.getByTestId('leaderboard-rank-delta');
    expect(delta).toHaveClass('custom-class');
  });

  it('applies custom testId', () => {
    render(
      <LeaderboardRankDelta
        currentRank={5}
        previousRank={8}
        testId="custom-delta"
      />
    );

    expect(screen.getByTestId('custom-delta')).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    render(
      <LeaderboardRankDelta
        currentRank={5}
        previousRank={8}
        history={[]}
      />
    );

    const delta = screen.getByTestId('leaderboard-rank-delta');
    expect(delta).toHaveAttribute('role', 'button');
    expect(delta).toHaveAttribute('tabIndex', '0');
    expect(delta).toHaveAttribute('aria-haspopup', 'false');
  });

  it('has aria-haspopup true when history is provided', () => {
    render(
      <LeaderboardRankDelta
        currentRank={5}
        previousRank={8}
        history={[{ date: '2026-08-17', rank: 10 }]}
      />
    );

    const delta = screen.getByTestId('leaderboard-rank-delta');
    expect(delta).toHaveAttribute('aria-haspopup', 'true');
  });

  it('handles keyboard focus', () => {
    render(
      <LeaderboardRankDelta
        currentRank={5}
        previousRank={8}
        history={[{ date: '2026-08-17', rank: 10 }]}
      />
    );

    const delta = screen.getByTestId('leaderboard-rank-delta');
    delta.focus();
    expect(delta).toHaveFocus();
  });

  it('shows tooltip on keyboard focus', () => {
    render(
      <LeaderboardRankDelta
        currentRank={5}
        previousRank={8}
        history={[{ date: '2026-08-17', rank: 10 }]}
      />
    );

    const delta = screen.getByTestId('leaderboard-rank-delta');
    delta.focus();

    const tooltip = delta.querySelector('.leaderboard-rank-delta__tooltip');
    expect(tooltip).toBeInTheDocument();
  });

  it('calculates delta correctly for large rank changes', () => {
    render(
      <LeaderboardRankDelta
        currentRank={1}
        previousRank={100}
      />
    );

    const delta = screen.getByTestId('leaderboard-rank-delta');
    expect(delta).toHaveTextContent(/↑ \+99/);
  });

  it('renders tooltip chart with correct number of bars', () => {
    const history: RankHistoryPoint[] = [
      { date: '2026-08-17', rank: 10 },
      { date: '2026-08-18', rank: 8 },
      { date: '2026-08-19', rank: 6 },
    ];

    render(
      <LeaderboardRankDelta
        currentRank={5}
        previousRank={8}
        history={history}
      />
    );

    const delta = screen.getByTestId('leaderboard-rank-delta');
    fireEvent.mouseEnter(delta);

    const bars = delta.querySelectorAll('.leaderboard-rank-delta__tooltip-bar');
    expect(bars.length).toBe(3);
  });

  it('displays correct stats in tooltip', () => {
    const history: RankHistoryPoint[] = [
      { date: '2026-08-17', rank: 10 },
      { date: '2026-08-18', rank: 8 },
      { date: '2026-08-19', rank: 6 },
    ];

    render(
      <LeaderboardRankDelta
        currentRank={5}
        previousRank={8}
        history={history}
      />
    );

    const delta = screen.getByTestId('leaderboard-rank-delta');
    fireEvent.mouseEnter(delta);

    expect(delta).toHaveTextContent('Best: #6');
    expect(delta).toHaveTextContent('Current: #5');
    expect(delta).toHaveTextContent('Average:');
  });
});