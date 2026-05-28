/**
 * @vitest-environment happy-dom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueueHealthWidget, type QueueMetrics } from '@/components/v1/QueueHealthWidget';

const mockMetrics: QueueMetrics = {
  playersInQueue: 42,
  averageWaitTime: 180, // 3 minutes
  estimatedWaitTime: 120, // 2 minutes
  activeMatches: 8,
  queueHealth: 'healthy',
  lastUpdated: '2024-01-15T10:30:00Z',
};

describe('QueueHealthWidget', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:35:00Z')); // 5 minutes after lastUpdated
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Primary Success Path', () => {
    it('renders queue metrics correctly', () => {
      render(<QueueHealthWidget metrics={mockMetrics} />);
      
      expect(screen.getByText('Game Queue')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument(); // players in queue
      expect(screen.getByText('2m 0s')).toBeInTheDocument(); // estimated wait time
      expect(screen.getByText('Healthy')).toBeInTheDocument(); // health status
    });

    it('displays health status with correct tone', () => {
      render(<QueueHealthWidget metrics={mockMetrics} />);
      
      const healthStatus = screen.getByTestId('queue-health-widget-health-status');
      expect(healthStatus).toHaveAttribute('data-tone', 'success');
    });

    it('shows detailed metrics when size is detailed', () => {
      render(
        <QueueHealthWidget 
          metrics={mockMetrics} 
          size="detailed" 
          showDetails={true} 
        />
      );
      
      expect(screen.getByText('8')).toBeInTheDocument(); // active matches
      expect(screen.getByText('Avg. Wait:')).toBeInTheDocument();
      expect(screen.getByText('3m 0s')).toBeInTheDocument(); // average wait time
      expect(screen.getByText('Updated:')).toBeInTheDocument();
      expect(screen.getByText('5m ago')).toBeInTheDocument(); // relative time
    });

    it('handles refresh functionality', () => {
      const mockOnRefresh = vi.fn();
      render(
        <QueueHealthWidget 
          metrics={mockMetrics} 
          onRefresh={mockOnRefresh}
          refreshInterval={0} // Disable auto-refresh for this test
        />
      );
      
      fireEvent.click(screen.getByTestId('queue-health-widget-refresh'));
      expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe('Auto-refresh Functionality', () => {
    it('auto-refreshes at specified interval', async () => {
      const mockOnRefresh = vi.fn();
      render(
        <QueueHealthWidget 
          metrics={mockMetrics} 
          onRefresh={mockOnRefresh}
          refreshInterval={5} // 5 seconds
        />
      );
      
      // Should show countdown
      expect(screen.getByText(/Next update in \d+s/)).toBeInTheDocument();
      
      // Fast-forward 5 seconds
      vi.advanceTimersByTime(5000);
      
      await waitFor(() => {
        expect(mockOnRefresh).toHaveBeenCalledTimes(1);
      });
    });

    it('shows refresh progress indicator', () => {
      render(
        <QueueHealthWidget 
          metrics={mockMetrics} 
          onRefresh={() => {}}
          refreshInterval={10}
        />
      );
      
      const progressElement = screen.getByText(/Next update in \d+s/).parentElement?.querySelector('.queue-health-widget__refresh-progress');
      expect(progressElement).toBeInTheDocument();
    });

    it('resets countdown on manual refresh', () => {
      const mockOnRefresh = vi.fn();
      render(
        <QueueHealthWidget 
          metrics={mockMetrics} 
          onRefresh={mockOnRefresh}
          refreshInterval={10}
        />
      );
      
      // Advance time partially
      vi.advanceTimersByTime(3000);
      
      // Manual refresh
      fireEvent.click(screen.getByTestId('queue-health-widget-refresh'));
      
      // Should reset to full interval
      expect(screen.getByText('Next update in 10s')).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Fallback Behavior', () => {
    it('shows loading state', () => {
      render(<QueueHealthWidget loading={true} />);
      
      expect(screen.getByTestId('queue-health-widget-loading')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('shows error state', () => {
      render(<QueueHealthWidget error="Failed to load queue data" onRefresh={() => {}} />);
      
      expect(screen.getByTestId('queue-health-widget-error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load queue data')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('handles retry from error state', () => {
      const mockOnRefresh = vi.fn();
      render(
        <QueueHealthWidget 
          error="Network error" 
          onRefresh={mockOnRefresh} 
        />
      );
      
      fireEvent.click(screen.getByText('Retry'));
      expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    });

    it('shows loading indicators in metrics when loading with existing data', () => {
      render(
        <QueueHealthWidget 
          metrics={mockMetrics} 
          loading={true} 
        />
      );
      
      // Should show dashes for loading values
      expect(screen.getAllByText('—')).toHaveLength(2); // players and wait time in default view
    });

    it('handles different health states correctly', () => {
      const degradedMetrics = { ...mockMetrics, queueHealth: 'degraded' as const };
      const { rerender } = render(<QueueHealthWidget metrics={degradedMetrics} />);
      
      expect(screen.getByTestId('queue-health-widget-health-status')).toHaveAttribute('data-tone', 'warning');
      
      const criticalMetrics = { ...mockMetrics, queueHealth: 'critical' as const };
      rerender(<QueueHealthWidget metrics={criticalMetrics} />);
      
      expect(screen.getByTestId('queue-health-widget-health-status')).toHaveAttribute('data-tone', 'error');
      
      const offlineMetrics = { ...mockMetrics, queueHealth: 'offline' as const };
      rerender(<QueueHealthWidget metrics={offlineMetrics} />);
      
      expect(screen.getByTestId('queue-health-widget-health-status')).toHaveAttribute('data-tone', 'neutral');
    });
  });

  describe('Time Formatting', () => {
    it('formats wait times correctly', () => {
      const metricsWithVariousTimes = {
        ...mockMetrics,
        estimatedWaitTime: 45, // 45 seconds
        averageWaitTime: 3665, // 1 hour, 1 minute, 5 seconds
      };
      
      render(
        <QueueHealthWidget 
          metrics={metricsWithVariousTimes} 
          size="detailed" 
          showDetails={true} 
        />
      );
      
      expect(screen.getByText('45s')).toBeInTheDocument(); // estimated wait
      expect(screen.getByText('1h 1m')).toBeInTheDocument(); // average wait (truncated)
    });

    it('formats relative timestamps correctly', () => {
      const recentMetrics = {
        ...mockMetrics,
        lastUpdated: new Date(Date.now() - 30000).toISOString(), // 30 seconds ago
      };
      
      render(
        <QueueHealthWidget 
          metrics={recentMetrics} 
          size="detailed" 
          showDetails={true} 
        />
      );
      
      expect(screen.getByText('30s ago')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<QueueHealthWidget metrics={mockMetrics} onRefresh={() => {}} />);
      
      const refreshButton = screen.getByTestId('queue-health-widget-refresh');
      expect(refreshButton).toHaveAttribute('aria-label', 'Refresh queue data');
    });

    it('provides status updates for screen readers', () => {
      render(<QueueHealthWidget loading={true} />);
      
      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });

    it('handles disabled states correctly', () => {
      render(
        <QueueHealthWidget 
          metrics={mockMetrics} 
          onRefresh={() => {}} 
          loading={true} 
        />
      );
      
      const refreshButton = screen.getByTestId('queue-health-widget-refresh');
      expect(refreshButton).toBeDisabled();
    });
  });

  describe('Layout Variants', () => {
    it('applies correct CSS classes for size variants', () => {
      const { rerender } = render(
        <QueueHealthWidget metrics={mockMetrics} size="compact" />
      );
      
      expect(screen.getByTestId('queue-health-widget')).toHaveClass('queue-health-widget--compact');
      
      rerender(<QueueHealthWidget metrics={mockMetrics} size="detailed" />);
      expect(screen.getByTestId('queue-health-widget')).toHaveClass('queue-health-widget--detailed');
    });

    it('shows appropriate labels for compact size', () => {
      render(<QueueHealthWidget metrics={mockMetrics} size="compact" />);
      
      expect(screen.getByText('Players')).toBeInTheDocument();
      expect(screen.getByText('Wait')).toBeInTheDocument();
    });

    it('shows full labels for default size', () => {
      render(<QueueHealthWidget metrics={mockMetrics} size="default" />);
      
      expect(screen.getByText('In Queue')).toBeInTheDocument();
      expect(screen.getByText('Est. Wait')).toBeInTheDocument();
    });
  });

  describe('Custom Queue Names', () => {
    it('displays custom queue name', () => {
      render(
        <QueueHealthWidget 
          metrics={mockMetrics} 
          queueName="Ranked Matchmaking" 
        />
      );
      
      expect(screen.getByText('Ranked Matchmaking')).toBeInTheDocument();
    });
  });
});