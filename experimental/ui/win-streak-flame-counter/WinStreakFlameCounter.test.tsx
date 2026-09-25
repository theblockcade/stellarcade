import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { WinStreakFlameCounter } from './WinStreakFlameCounter';
import { getFlameTier, formatMultiplier, buildAriaLabel } from './WinStreakFlameCounter';

afterEach(cleanup);

describe('WinStreakFlameCounter', () => {
  it('renders a dormant state when streak is zero', () => {
    render(<WinStreakFlameCounter streakCount={0} multiplier={1} />);

    const badge = screen.getByTestId('win-streak-flame-counter');
    expect(badge).toHaveAttribute('data-tier', 'dormant');

    const flame = screen.getByTestId('win-streak-flame-counter-flame');
    expect(flame).toHaveClass('win-streak-flame-counter__flame--dormant');

    expect(
      screen.queryByTestId('win-streak-flame-counter-count'),
    ).not.toBeInTheDocument();
  });

  it('renders dormant aria label for a zero streak', () => {
    render(<WinStreakFlameCounter streakCount={0} multiplier={1} />);

    const badge = screen.getByTestId('win-streak-flame-counter');
    expect(badge).toHaveAttribute(
      'aria-label',
      'No active win streak. Streak dormant.',
    );
  });

  it('renders roaring flame styling and correct label for a 5 streak', () => {
    render(<WinStreakFlameCounter streakCount={5} multiplier={2} />);

    const badge = screen.getByTestId('win-streak-flame-counter');
    expect(badge).toHaveAttribute('data-tier', 'roar');

    const flame = screen.getByTestId('win-streak-flame-counter-flame');
    expect(flame).toHaveClass('win-streak-flame-counter__flame--roar');

    expect(badge).toHaveAttribute(
      'aria-label',
      '5 consecutive wins, 2.0x multiplier bonus',
    );

    expect(screen.getByTestId('win-streak-flame-counter-count')).toHaveTextContent('5');
  });

  it('renders an inferno overdrive style for streaks of 6 or more', () => {
    render(<WinStreakFlameCounter streakCount={9} multiplier={3.5} />);

    const badge = screen.getByTestId('win-streak-flame-counter');
    expect(badge).toHaveAttribute('data-tier', 'inferno');
    expect(screen.getByTestId('win-streak-flame-counter-flame')).toHaveClass(
      'win-streak-flame-counter__flame--inferno',
    );
  });

  it('renders a subtle spark style for 1-2 streaks', () => {
    render(<WinStreakFlameCounter streakCount={1} multiplier={1} />);

    expect(screen.getByTestId('win-streak-flame-counter')).toHaveAttribute(
      'data-tier',
      'spark',
    );
  });

  it('renders the multiplier badge as a formatted multiplier string', () => {
    render(<WinStreakFlameCounter streakCount={3} multiplier={1.5} />);

    const multiplier = screen.getByTestId('win-streak-flame-counter-multiplier');
    expect(multiplier).toHaveTextContent('1.5x');
  });

  it('formats integer multipliers with a trailing zero', () => {
    render(<WinStreakFlameCounter streakCount={3} multiplier={2} />);

    expect(
      screen.getByTestId('win-streak-flame-counter-multiplier'),
    ).toHaveTextContent('2.0x');
  });

  it('hides the multiplier badge when showMultiplier is false', () => {
    render(
      <WinStreakFlameCounter
        streakCount={4}
        multiplier={1.5}
        showMultiplier={false}
      />,
    );

    expect(
      screen.queryByTestId('win-streak-flame-counter-multiplier'),
    ).not.toBeInTheDocument();
  });

  it('applies size classes', () => {
    const { rerender } = render(
      <WinStreakFlameCounter streakCount={2} multiplier={1} size="sm" />,
    );
    expect(screen.getByTestId('win-streak-flame-counter')).toHaveClass(
      'win-streak-flame-counter--sm',
    );

    rerender(<WinStreakFlameCounter streakCount={2} multiplier={1} size="lg" />);
    expect(screen.getByTestId('win-streak-flame-counter')).toHaveClass(
      'win-streak-flame-counter--lg',
    );
  });

  it('exposes the streak count to assistive tech via data attribute', () => {
    render(<WinStreakFlameCounter streakCount={5} multiplier={2} />);
    expect(screen.getByTestId('win-streak-flame-counter')).toHaveAttribute(
      'data-streak',
      '5',
    );
  });

  it('getFlameTier resolves tier boundaries correctly', () => {
    expect(getFlameTier(0)).toBe('dormant');
    expect(getFlameTier(-3)).toBe('dormant');
    expect(getFlameTier(1)).toBe('spark');
    expect(getFlameTier(2)).toBe('spark');
    expect(getFlameTier(3)).toBe('roar');
    expect(getFlameTier(5)).toBe('roar');
    expect(getFlameTier(6)).toBe('inferno');
    expect(getFlameTier(12)).toBe('inferno');
  });

  it('formats multipliers', () => {
    expect(formatMultiplier(1.5)).toBe('1.5x');
    expect(formatMultiplier(2)).toBe('2.0x');
  });

  it('builds singular aria labels for a one-win streak', () => {
    expect(
      buildAriaLabel(1, 1.5, true),
    ).toBe('1 consecutive win, 1.5x multiplier bonus');
  });
});