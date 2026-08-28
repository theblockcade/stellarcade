import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
import { GameHudOverlay, formatWager } from './GameHudOverlay';
import { TimerCountdownCircle, computeDashOffset } from './TimerCountdownCircle';
import type { PlayerHudData } from './types';

const p1: PlayerHudData = { name: 'Alice', score: 3, isCurrentTurn: true };
const p2: PlayerHudData = { name: 'Bob', score: 1 };

function renderHud(overrides: Partial<React.ComponentProps<typeof GameHudOverlay>> = {}) {
  const onSendReaction = vi.fn();
  const onSurrender = vi.fn();
  const utils = render(
    <GameHudOverlay
      p1={p1}
      p2={p2}
      secondsRemaining={30}
      wagerAmount={100}
      onSendReaction={onSendReaction}
      onSurrender={onSurrender}
      {...overrides}
    />,
  );
  return { ...utils, onSendReaction, onSurrender };
}

describe('formatWager', () => {
  it('formats a wager amount with 2 decimals and the XLM symbol', () => {
    expect(formatWager(100)).toBe('100.00 XLM');
    expect(formatWager(42.5)).toBe('42.50 XLM');
  });
});

describe('GameHudOverlay — rendering', () => {
  it('renders both player score pills with names and scores', () => {
    renderHud();
    expect(screen.getByTestId('player-score-pill-p1')).toBeDefined();
    expect(screen.getByText('Alice')).toBeDefined();
    expect(screen.getByTestId('player-score-p1').textContent).toBe('3');
    expect(screen.getByText('Bob')).toBeDefined();
    expect(screen.getByTestId('player-score-p2').textContent).toBe('1');
  });

  it('renders the wager amount', () => {
    renderHud({ wagerAmount: 250 });
    expect(screen.getByTestId('wager-amount').textContent).toBe('250.00 XLM');
  });

  it('marks the current-turn player pill as active', () => {
    renderHud();
    expect(screen.getByTestId('player-score-pill-p1').className).toContain('player-score-pill--active');
    expect(screen.getByTestId('player-score-pill-p2').className).not.toContain('player-score-pill--active');
  });

  it('renders all four reaction buttons', () => {
    renderHud();
    expect(screen.getByTestId('reaction-button-🔥')).toBeDefined();
    expect(screen.getByTestId('reaction-button-👏')).toBeDefined();
    expect(screen.getByTestId('reaction-button-🎯')).toBeDefined();
    expect(screen.getByTestId('reaction-button-💀')).toBeDefined();
  });
});

describe('GameHudOverlay — reactions', () => {
  it('calls onSendReaction with the clicked emoji', () => {
    const { onSendReaction } = renderHud();
    fireEvent.click(screen.getByTestId('reaction-button-🔥'));
    expect(onSendReaction).toHaveBeenCalledWith('🔥');
  });

  it('shows a floating reaction after clicking a reaction button', () => {
    renderHud();
    fireEvent.click(screen.getByTestId('reaction-button-👏'));
    expect(screen.getAllByTestId('floating-reaction')).toHaveLength(1);
  });

  it('fades a floating reaction out after its animation duration', () => {
    vi.useFakeTimers();
    renderHud();
    act(() => {
      fireEvent.click(screen.getByTestId('reaction-button-🎯'));
    });
    expect(screen.getAllByTestId('floating-reaction')).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(1300);
    });
    expect(screen.queryAllByTestId('floating-reaction')).toHaveLength(0);
    vi.useRealTimers();
  });
});

describe('GameHudOverlay — surrender flow', () => {
  it('does not call onSurrender immediately on the first click', () => {
    const { onSurrender } = renderHud();
    fireEvent.click(screen.getByTestId('surrender-button'));
    expect(onSurrender).not.toHaveBeenCalled();
  });

  it('shows a confirmation dialog after the first surrender click', () => {
    renderHud();
    fireEvent.click(screen.getByTestId('surrender-button'));
    expect(screen.getByTestId('surrender-confirm-dialog')).toBeDefined();
  });

  it('calls onSurrender only after confirming', () => {
    const { onSurrender } = renderHud();
    fireEvent.click(screen.getByTestId('surrender-button'));
    fireEvent.click(screen.getByTestId('surrender-confirm-yes'));
    expect(onSurrender).toHaveBeenCalledTimes(1);
  });

  it('dismisses the dialog without surrendering when cancelled', () => {
    const { onSurrender } = renderHud();
    fireEvent.click(screen.getByTestId('surrender-button'));
    fireEvent.click(screen.getByTestId('surrender-confirm-no'));
    expect(onSurrender).not.toHaveBeenCalled();
    expect(screen.queryByTestId('surrender-confirm-dialog')).toBeNull();
  });
});

describe('TimerCountdownCircle', () => {
  it('renders the seconds remaining, rounded up', () => {
    render(<TimerCountdownCircle secondsRemaining={12.4} totalSeconds={60} />);
    expect(screen.getByTestId('timer-seconds-label').textContent).toBe('13');
  });

  it('is not urgent when seconds remaining is above the threshold', () => {
    render(<TimerCountdownCircle secondsRemaining={10} totalSeconds={60} />);
    expect(screen.getByTestId('timer-countdown-circle').getAttribute('data-urgent')).toBe('false');
  });

  it('turns urgent (red/pulsing) when seconds remaining drops to 5 or below', () => {
    render(<TimerCountdownCircle secondsRemaining={5} totalSeconds={60} />);
    const el = screen.getByTestId('timer-countdown-circle');
    expect(el.getAttribute('data-urgent')).toBe('true');
    expect(el.className).toContain('timer-countdown-circle--urgent');
  });

  it('is not urgent once time has fully run out', () => {
    render(<TimerCountdownCircle secondsRemaining={0} totalSeconds={60} />);
    expect(screen.getByTestId('timer-countdown-circle').getAttribute('data-urgent')).toBe('false');
  });
});

describe('computeDashOffset', () => {
  it('returns 0 offset (full circle drawn) at fraction 1', () => {
    expect(computeDashOffset(1, 18)).toBeCloseTo(0, 5);
  });

  it('returns the full circumference (nothing drawn) at fraction 0', () => {
    const circumference = 2 * Math.PI * 18;
    expect(computeDashOffset(0, 18)).toBeCloseTo(circumference, 5);
  });

  it('clamps fractions outside [0, 1]', () => {
    expect(computeDashOffset(-1, 18)).toBeCloseTo(computeDashOffset(0, 18), 5);
    expect(computeDashOffset(2, 18)).toBeCloseTo(computeDashOffset(1, 18), 5);
  });
});
