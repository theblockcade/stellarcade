import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RewardBalanceSparklineCard } from '../../../src/components/v1/RewardBalanceSparklineCard';

const defaultProps = {
  label: 'XLM Rewards',
  balance: '1,234.56',
  balanceEquivalent: '≈ $185.00',
  dataPoints: [10, 15, 12, 20, 18, 25, 22],
  change: '+4.2%',
  trend: 'up' as const,
};

describe('RewardBalanceSparklineCard', () => {
  describe('Rendering', () => {
    it('renders the card with label', () => {
      render(<RewardBalanceSparklineCard {...defaultProps} />);
      expect(screen.getByTestId('reward-balance-sparkline-card-label')).toHaveTextContent('XLM Rewards');
    });

    it('renders balance value', () => {
      render(<RewardBalanceSparklineCard {...defaultProps} />);
      expect(screen.getByTestId('reward-balance-sparkline-card-balance')).toHaveTextContent('1,234.56');
    });

    it('renders fiat equivalent', () => {
      render(<RewardBalanceSparklineCard {...defaultProps} />);
      expect(screen.getByTestId('reward-balance-sparkline-card-equivalent')).toHaveTextContent('≈ $185.00');
    });

    it('renders the change badge', () => {
      render(<RewardBalanceSparklineCard {...defaultProps} />);
      expect(screen.getByTestId('reward-balance-sparkline-card-change')).toHaveTextContent('+4.2%');
    });

    it('renders sparkline SVG when dataPoints has 2+ points', () => {
      render(<RewardBalanceSparklineCard {...defaultProps} />);
      expect(screen.getByTestId('reward-balance-sparkline-card-sparkline')).toBeInTheDocument();
    });

    it('does not render sparkline for fewer than 2 data points', () => {
      render(<RewardBalanceSparklineCard {...defaultProps} dataPoints={[10]} />);
      expect(screen.queryByTestId('reward-balance-sparkline-card-sparkline')).not.toBeInTheDocument();
    });

    it('does not render equivalent when not provided', () => {
      render(<RewardBalanceSparklineCard {...defaultProps} balanceEquivalent={undefined} />);
      expect(screen.queryByTestId('reward-balance-sparkline-card-equivalent')).not.toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('shows loading skeleton when status is loading', () => {
      render(<RewardBalanceSparklineCard label="XLM" status="loading" />);
      expect(screen.getByTestId('reward-balance-sparkline-card-loading')).toBeInTheDocument();
    });

    it('sets aria-busy when loading', () => {
      render(<RewardBalanceSparklineCard label="XLM" status="loading" />);
      expect(screen.getByTestId('reward-balance-sparkline-card')).toHaveAttribute('aria-busy', 'true');
    });

    it('does not show balance when loading', () => {
      render(<RewardBalanceSparklineCard {...defaultProps} status="loading" />);
      expect(screen.queryByTestId('reward-balance-sparkline-card-balance')).not.toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('renders error message when status is error', () => {
      render(<RewardBalanceSparklineCard label="XLM" status="error" error="Failed to load" />);
      expect(screen.getByTestId('reward-balance-sparkline-card-error')).toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', () => {
      const onRetry = vi.fn();
      render(<RewardBalanceSparklineCard label="XLM" status="error" onRetry={onRetry} />);
      fireEvent.click(screen.getByTestId('reward-balance-sparkline-card-retry'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('uses default error message when none provided', () => {
      render(<RewardBalanceSparklineCard label="XLM" status="error" />);
      expect(screen.getByTestId('reward-balance-sparkline-card-error')).toHaveTextContent(
        'Failed to load balance.'
      );
    });
  });

  describe('Empty state', () => {
    it('shows empty dash when balance is undefined and status is idle', () => {
      render(<RewardBalanceSparklineCard label="XLM" />);
      expect(screen.getByTestId('reward-balance-sparkline-card-empty')).toBeInTheDocument();
    });
  });

  describe('Trend variants', () => {
    it('reflects up trend on change badge', () => {
      render(<RewardBalanceSparklineCard {...defaultProps} trend="up" change="+2%" />);
      const badge = screen.getByTestId('reward-balance-sparkline-card-change');
      expect(badge.getAttribute('aria-label')).toContain('up');
    });

    it('reflects down trend on change badge', () => {
      render(<RewardBalanceSparklineCard {...defaultProps} trend="down" change="-1%" />);
      const badge = screen.getByTestId('reward-balance-sparkline-card-change');
      expect(badge.getAttribute('aria-label')).toContain('down');
    });
  });

  describe('Accessibility', () => {
    it('card has article role with aria-label', () => {
      render(<RewardBalanceSparklineCard {...defaultProps} />);
      expect(screen.getByRole('article')).toHaveAttribute(
        'aria-label',
        'XLM Rewards balance card'
      );
    });

    it('accepts a custom ariaLabel', () => {
      render(<RewardBalanceSparklineCard {...defaultProps} ariaLabel="Custom Label" />);
      expect(screen.getByRole('article')).toHaveAttribute('aria-label', 'Custom Label');
    });
  });
});
