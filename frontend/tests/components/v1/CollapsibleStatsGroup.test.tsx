import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CollapsibleStatsGroup } from '../../../src/components/v1/CollapsibleStatsGroup';
import type { StatItem } from '../../../src/components/v1/CollapsibleStatsGroup';

const items: StatItem[] = [
  { id: 'rewards', label: 'Total Rewards', value: '1,234 XLM', trend: 'up', change: '+5%' },
  { id: 'staked', label: 'Staked', value: '500 XLM' },
];

describe('CollapsibleStatsGroup', () => {
  describe('Rendering', () => {
    it('renders the group header', () => {
      render(<CollapsibleStatsGroup title="Portfolio Stats" items={items} />);
      expect(screen.getByText('Portfolio Stats')).toBeInTheDocument();
    });

    it('hides the panel by default when defaultExpanded is false', () => {
      render(<CollapsibleStatsGroup title="Stats" items={items} defaultExpanded={false} />);
      expect(screen.getByTestId('collapsible-stats-group-panel')).toHaveAttribute('hidden');
    });

    it('shows the panel when defaultExpanded is true', () => {
      render(<CollapsibleStatsGroup title="Stats" items={items} defaultExpanded />);
      expect(screen.getByTestId('collapsible-stats-group-panel')).not.toHaveAttribute('hidden');
    });

    it('shows summary text when collapsed', () => {
      render(
        <CollapsibleStatsGroup title="Stats" items={items} summary="2 metrics" defaultExpanded={false} />
      );
      expect(screen.getByTestId('collapsible-stats-group-summary')).toHaveTextContent('2 metrics');
    });
  });

  describe('Toggle behaviour', () => {
    it('expands on toggle button click', () => {
      render(<CollapsibleStatsGroup title="Stats" items={items} />);
      fireEvent.click(screen.getByTestId('collapsible-stats-group-toggle'));
      expect(screen.getByTestId('collapsible-stats-group-panel')).not.toHaveAttribute('hidden');
    });

    it('collapses after second click', () => {
      render(<CollapsibleStatsGroup title="Stats" items={items} />);
      const toggle = screen.getByTestId('collapsible-stats-group-toggle');
      fireEvent.click(toggle);
      fireEvent.click(toggle);
      expect(screen.getByTestId('collapsible-stats-group-panel')).toHaveAttribute('hidden');
    });

    it('calls onToggle with the new expanded state', () => {
      const onToggle = vi.fn();
      render(<CollapsibleStatsGroup title="Stats" items={items} onToggle={onToggle} />);
      fireEvent.click(screen.getByTestId('collapsible-stats-group-toggle'));
      expect(onToggle).toHaveBeenCalledWith(true);
    });

    it('expands on Enter key', () => {
      render(<CollapsibleStatsGroup title="Stats" items={items} />);
      fireEvent.keyDown(screen.getByTestId('collapsible-stats-group-toggle'), { key: 'Enter' });
      expect(screen.getByTestId('collapsible-stats-group-panel')).not.toHaveAttribute('hidden');
    });

    it('expands on Space key', () => {
      render(<CollapsibleStatsGroup title="Stats" items={items} />);
      fireEvent.keyDown(screen.getByTestId('collapsible-stats-group-toggle'), { key: ' ' });
      expect(screen.getByTestId('collapsible-stats-group-panel')).not.toHaveAttribute('hidden');
    });
  });

  describe('Stat items', () => {
    it('renders each item when expanded', () => {
      render(<CollapsibleStatsGroup title="Stats" items={items} defaultExpanded />);
      expect(screen.getByTestId('collapsible-stats-group-item-rewards')).toBeInTheDocument();
      expect(screen.getByTestId('collapsible-stats-group-item-staked')).toBeInTheDocument();
    });

    it('renders trend indicator for items with trend', () => {
      render(<CollapsibleStatsGroup title="Stats" items={items} defaultExpanded />);
      expect(screen.getByText('+5%')).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('shows empty message when no items and expanded', () => {
      render(<CollapsibleStatsGroup title="Stats" items={[]} defaultExpanded />);
      expect(screen.getByTestId('collapsible-stats-group-empty')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('shows error message when error prop is set', () => {
      render(
        <CollapsibleStatsGroup title="Stats" items={[]} error="Failed to fetch" defaultExpanded />
      );
      expect(screen.getByTestId('collapsible-stats-group-error')).toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', () => {
      const onRetry = vi.fn();
      render(
        <CollapsibleStatsGroup title="Stats" items={[]} error="Error" onRetry={onRetry} defaultExpanded />
      );
      fireEvent.click(screen.getByTestId('collapsible-stats-group-retry'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('toggle button has aria-expanded reflecting state', () => {
      render(<CollapsibleStatsGroup title="Stats" items={items} defaultExpanded={false} />);
      const toggle = screen.getByTestId('collapsible-stats-group-toggle');
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
    });

    it('toggle button has aria-controls pointing to the panel', () => {
      render(<CollapsibleStatsGroup title="Stats" items={items} />);
      const toggle = screen.getByTestId('collapsible-stats-group-toggle');
      const panel = screen.getByTestId('collapsible-stats-group-panel');
      expect(toggle.getAttribute('aria-controls')).toBe(panel.id);
    });
  });
});
