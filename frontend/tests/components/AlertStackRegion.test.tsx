/**
 * @vitest-environment happy-dom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AlertStackRegion, type AlertItem } from '@/components/v1/AlertStackRegion';

const mockAlerts: AlertItem[] = [
  {
    id: 'alert-1',
    severity: 'info',
    title: 'System Update',
    message: 'The system will undergo maintenance at midnight.',
    source: 'System',
  },
  {
    id: 'alert-2',
    severity: 'success',
    message: 'Your transaction was processed successfully.',
  },
  {
    id: 'alert-3',
    severity: 'warning',
    title: 'Low Balance',
    message: 'Your wallet balance is running low.',
    dismissible: true,
    actions: [
      { id: 'top-up', label: 'Top Up', variant: 'primary' },
      { id: 'dismiss', label: 'Ignore' },
    ],
  },
  {
    id: 'alert-4',
    severity: 'error',
    title: 'Connection Failed',
    message: 'Unable to connect to the blockchain network.',
    dismissible: false,
  },
];

describe('AlertStackRegion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Primary Success Path', () => {
    it('renders all alerts with correct severity styling', () => {
      render(<AlertStackRegion alerts={mockAlerts} />);

      expect(screen.getByTestId('alert-stack-region-alert-alert-1')).toHaveClass('alert-stack__item--info');
      expect(screen.getByTestId('alert-stack-region-alert-alert-2')).toHaveClass('alert-stack__item--success');
      expect(screen.getByTestId('alert-stack-region-alert-alert-3')).toHaveClass('alert-stack__item--warning');
      expect(screen.getByTestId('alert-stack-region-alert-alert-4')).toHaveClass('alert-stack__item--error');
    });

    it('renders alert titles and messages', () => {
      render(<AlertStackRegion alerts={mockAlerts} />);

      expect(screen.getByText('System Update')).toBeInTheDocument();
      expect(screen.getByText('The system will undergo maintenance at midnight.')).toBeInTheDocument();
      expect(screen.getByText('Your transaction was processed successfully.')).toBeInTheDocument();
    });

    it('falls back to severity label when title is missing', () => {
      render(<AlertStackRegion alerts={[mockAlerts[1]]} />);

      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    it('renders source tags', () => {
      render(<AlertStackRegion alerts={mockAlerts} />);

      expect(screen.getByText('System')).toBeInTheDocument();
    });

    it('renders action buttons and handles clicks', () => {
      const onAction = vi.fn();
      render(<AlertStackRegion alerts={mockAlerts} onAction={onAction} />);

      const topUpBtn = screen.getByTestId('alert-stack-region-action-top-up');
      expect(topUpBtn).toHaveClass('alert-stack__action--primary');
      fireEvent.click(topUpBtn);
      expect(onAction).toHaveBeenCalledWith('alert-3', 'top-up');
    });

    it('handles dismiss callback', () => {
      const onDismiss = vi.fn();
      render(<AlertStackRegion alerts={mockAlerts} onDismiss={onDismiss} />);

      fireEvent.click(screen.getByTestId('alert-stack-region-dismiss-alert-1'));
      expect(onDismiss).toHaveBeenCalledWith('alert-1');
    });
  });

  describe('Edge Cases and Fallback Behavior', () => {
    it('renders nothing when alerts array is empty', () => {
      const { container } = render(<AlertStackRegion alerts={[]} />);

      expect(container.firstChild).toBeNull();
    });

    it('collapses alerts beyond maxVisible', () => {
      const manyAlerts: AlertItem[] = Array.from({ length: 8 }, (_, i) => ({
        id: `alert-${i}`,
        severity: 'info' as const,
        message: `Alert ${i}`,
      }));

      render(<AlertStackRegion alerts={manyAlerts} maxVisible={3} />);

      expect(screen.getByTestId('alert-stack-region-alert-alert-0')).toBeInTheDocument();
      expect(screen.getByTestId('alert-stack-region-alert-alert-2')).toBeInTheDocument();
      expect(screen.queryByTestId('alert-stack-region-alert-alert-3')).not.toBeInTheDocument();
      expect(screen.getByText('5 more alerts')).toBeInTheDocument();
    });

    it('expands to show all alerts when expander is clicked', () => {
      const manyAlerts: AlertItem[] = Array.from({ length: 8 }, (_, i) => ({
        id: `alert-${i}`,
        severity: 'info' as const,
        message: `Alert ${i}`,
      }));

      render(<AlertStackRegion alerts={manyAlerts} maxVisible={3} />);

      fireEvent.click(screen.getByTestId('alert-stack-region-expander'));

      expect(screen.getByTestId('alert-stack-region-alert-alert-7')).toBeInTheDocument();
      expect(screen.queryByTestId('alert-stack-region-expander')).not.toBeInTheDocument();
    });

    it('does not show dismiss button for non-dismissible alerts', () => {
      render(<AlertStackRegion alerts={mockAlerts} onDismiss={vi.fn()} />);

      expect(screen.queryByTestId('alert-stack-region-dismiss-alert-4')).not.toBeInTheDocument();
    });

    it('does not show dismiss button when onDismiss is not provided', () => {
      render(<AlertStackRegion alerts={mockAlerts} />);

      expect(screen.queryByTestId('alert-stack-region-dismiss-alert-1')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('uses role=alert for error and warning alerts', () => {
      render(<AlertStackRegion alerts={mockAlerts} />);

      expect(screen.getByTestId('alert-stack-region-alert-alert-3')).toHaveAttribute('role', 'alert');
      expect(screen.getByTestId('alert-stack-region-alert-alert-4')).toHaveAttribute('role', 'alert');
    });

    it('uses role=status for info and success alerts', () => {
      render(<AlertStackRegion alerts={mockAlerts} />);

      expect(screen.getByTestId('alert-stack-region-alert-alert-1')).toHaveAttribute('role', 'status');
      expect(screen.getByTestId('alert-stack-region-alert-alert-2')).toHaveAttribute('role', 'status');
    });

    it('has aria-label on dismiss button', () => {
      render(<AlertStackRegion alerts={mockAlerts} onDismiss={vi.fn()} />);

      expect(screen.getByLabelText('Dismiss System Update alert')).toBeInTheDocument();
    });
  });
});
