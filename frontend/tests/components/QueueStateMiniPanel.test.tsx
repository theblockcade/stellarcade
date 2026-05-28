/**
 * @vitest-environment happy-dom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueueStateMiniPanel } from '@/components/v1/QueueStateMiniPanel';
import type { QueueMetrics } from '@/components/v1/QueueHealthWidget';

const mockMetrics: QueueMetrics = {
  playersInQueue: 18,
  averageWaitTime: 60,
  estimatedWaitTime: 45,
  activeMatches: 6,
  queueHealth: 'healthy',
  lastUpdated: new Date(Date.now() - 10000).toISOString(),
};

describe('QueueStateMiniPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Primary Success Path', () => {
    it('renders queue metrics in lobby context', () => {
      render(<QueueStateMiniPanel metrics={mockMetrics} context="lobby" />);

      expect(screen.getByTestId('queue-state-mini-panel')).toBeInTheDocument();
      expect(screen.getByText('Queue Status')).toBeInTheDocument();
      expect(screen.getByText('18')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument();
      expect(screen.getByText('Lobby queue')).toBeInTheDocument();
    });

    it('renders queue metrics in live-match context', () => {
      render(<QueueStateMiniPanel metrics={mockMetrics} context="live-match" />);

      expect(screen.getByText('Match Queue')).toBeInTheDocument();
      expect(screen.getByText('Live match')).toBeInTheDocument();
    });

    it('applies correct CSS class for each context', () => {
      const { rerender } = render(
        <QueueStateMiniPanel metrics={mockMetrics} context="lobby" />,
      );

      expect(screen.getByTestId('queue-state-mini-panel')).toHaveClass(
        'queue-state-mini-panel--lobby',
      );

      rerender(<QueueStateMiniPanel metrics={mockMetrics} context="live-match" />);
      expect(screen.getByTestId('queue-state-mini-panel')).toHaveClass(
        'queue-state-mini-panel--live-match',
      );
    });

    it('shows health status pill with correct tone for healthy queue', () => {
      render(<QueueStateMiniPanel metrics={mockMetrics} />);

      expect(screen.getByTestId('queue-state-mini-panel-health')).toHaveAttribute(
        'data-tone',
        'success',
      );
    });

    it('calls onRefresh when refresh button is clicked', () => {
      const mockRefresh = vi.fn();
      render(<QueueStateMiniPanel metrics={mockMetrics} onRefresh={mockRefresh} />);

      fireEvent.click(screen.getByTestId('queue-state-mini-panel-refresh'));
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it('accepts a custom title override', () => {
      render(<QueueStateMiniPanel metrics={mockMetrics} title="Ranked Matchmaking" />);

      expect(screen.getByText('Ranked Matchmaking')).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Fallback Behavior', () => {
    it('shows loading state when no metrics are provided and loading is true', () => {
      render(<QueueStateMiniPanel loading={true} />);

      expect(screen.getByTestId('queue-state-mini-panel-loading')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('falls back to offline defaults when metrics prop is omitted', () => {
      render(<QueueStateMiniPanel />);

      expect(screen.getByTestId('queue-state-mini-panel')).toBeInTheDocument();
      expect(screen.getByTestId('queue-state-mini-panel-health')).toHaveAttribute(
        'data-tone',
        'neutral',
      );
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });

    it('renders error state and retry button', () => {
      const mockRetry = vi.fn();
      render(<QueueStateMiniPanel error="Failed to fetch" onRefresh={mockRetry} />);

      expect(screen.getByTestId('queue-state-mini-panel-error')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Retry'));
      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('shows dashes for metrics when loading with existing data', () => {
      render(<QueueStateMiniPanel metrics={mockMetrics} loading={true} />);

      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThanOrEqual(3);
    });

    it('renders degraded, critical, and offline health tones correctly', () => {
      const cases: Array<[QueueMetrics['queueHealth'], string]> = [
        ['degraded', 'warning'],
        ['critical', 'error'],
        ['offline', 'neutral'],
      ];

      for (const [health, expectedTone] of cases) {
        const { unmount } = render(
          <QueueStateMiniPanel metrics={{ ...mockMetrics, queueHealth: health }} />,
        );
        expect(screen.getByTestId('queue-state-mini-panel-health')).toHaveAttribute(
          'data-tone',
          expectedTone,
        );
        unmount();
      }
    });

    it('omits refresh button when onRefresh is not provided', () => {
      render(<QueueStateMiniPanel metrics={mockMetrics} />);

      expect(screen.queryByTestId('queue-state-mini-panel-refresh')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('refresh button has descriptive aria-label', () => {
      render(<QueueStateMiniPanel metrics={mockMetrics} onRefresh={() => {}} />);

      expect(screen.getByTestId('queue-state-mini-panel-refresh')).toHaveAttribute(
        'aria-label',
        'Refresh queue status',
      );
    });

    it('loading state announces via aria-live', () => {
      render(<QueueStateMiniPanel loading={true} />);

      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });

    it('error state uses role="alert"', () => {
      render(<QueueStateMiniPanel error="Network error" />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('refresh button is disabled while loading', () => {
      render(
        <QueueStateMiniPanel metrics={mockMetrics} onRefresh={() => {}} loading={true} />,
      );

      expect(screen.getByTestId('queue-state-mini-panel-refresh')).toBeDisabled();
    });
  });

  describe('Context-specific behaviour', () => {
    it('does not pulse the context dot when the queue is offline in live-match context', () => {
      const offlineMetrics: QueueMetrics = { ...mockMetrics, queueHealth: 'offline' };
      render(<QueueStateMiniPanel metrics={offlineMetrics} context="live-match" />);

      const dot = screen.getByTestId('queue-state-mini-panel').querySelector(
        '.queue-state-mini-panel__context-dot',
      );
      expect(dot).not.toHaveClass('queue-state-mini-panel__context-dot--pulsing');
    });

    it('pulses the context dot when live-match queue is healthy', () => {
      render(<QueueStateMiniPanel metrics={mockMetrics} context="live-match" />);

      const dot = screen.getByTestId('queue-state-mini-panel').querySelector(
        '.queue-state-mini-panel__context-dot',
      );
      expect(dot).toHaveClass('queue-state-mini-panel__context-dot--pulsing');
    });
  });
});
