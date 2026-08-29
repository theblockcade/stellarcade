import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { formatMiniWagerDelta, getRecentWagers, WagerMiniDropdown } from './WagerMiniDropdown';
import type { WagerSummary } from './types';

const wagers: WagerSummary[] = [
  { id: 'older', gameName: 'Roulette', gameIcon: '????', timestamp: '2026-08-26T12:00:00.000Z', wagerAmountXlm: 10, netProfitXlm: -10, outcome: 'lost', txHash: 'olderhash0000000000' },
  { id: 'newer', gameName: 'Coinflip', gameIcon: '????', timestamp: '2026-08-29T12:00:00.000Z', wagerAmountXlm: 15, netProfitXlm: 22.5, outcome: 'won', txHash: 'newerhash0000000000' },
];

describe('WagerMiniDropdown', () => {
  it('opens and closes the recent wagers popover', () => {
    render(<WagerMiniDropdown recentWagers={wagers} onViewFullHistory={vi.fn()} />);

    fireEvent.click(screen.getByTestId('wager-mini-dropdown-trigger'));
    expect(screen.getByTestId('wager-mini-dropdown-panel')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByTestId('wager-mini-dropdown-panel')).not.toBeInTheDocument();
  });

  it('renders wager rows with formatted profit deltas', () => {
    render(<WagerMiniDropdown recentWagers={wagers} onViewFullHistory={vi.fn()} />);

    fireEvent.click(screen.getByTestId('wager-mini-dropdown-trigger'));

    expect(screen.getByText('Coinflip')).toBeInTheDocument();
    expect(screen.getByText('+22.50 XLM')).toBeInTheDocument();
    expect(screen.getByText('-10.00 XLM')).toBeInTheDocument();
  });

  it('calls selection and full history callbacks', () => {
    const onSelectWager = vi.fn();
    const onViewFullHistory = vi.fn();
    render(
      <WagerMiniDropdown
        recentWagers={wagers}
        onSelectWager={onSelectWager}
        onViewFullHistory={onViewFullHistory}
      />,
    );

    fireEvent.click(screen.getByTestId('wager-mini-dropdown-trigger'));
    fireEvent.click(screen.getByTestId('wager-mini-dropdown-item-newer'));
    fireEvent.click(screen.getByText('View Full History'));

    expect(onSelectWager).toHaveBeenCalledWith('newerhash0000000000');
    expect(onViewFullHistory).toHaveBeenCalledTimes(1);
  });

  it('shows an empty state when there are no recent wagers', () => {
    render(<WagerMiniDropdown recentWagers={[]} onViewFullHistory={vi.fn()} />);

    fireEvent.click(screen.getByTestId('wager-mini-dropdown-trigger'));

    expect(screen.getByText('No recent wagers yet.')).toBeInTheDocument();
  });

  it('keeps only the five newest wagers', () => {
    const many = Array.from({ length: 7 }, (_, index) => ({
      ...wagers[0],
      id: `wager-${index}`,
      timestamp: `2026-08-${20 + index}T12:00:00.000Z`,
    }));

    expect(getRecentWagers(many)).toHaveLength(5);
    expect(formatMiniWagerDelta(0)).toBe('0.00 XLM');
  });
});