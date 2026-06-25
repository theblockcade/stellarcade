import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RequestErrorStateBlock } from '@/components/v1/RequestErrorStateBlock';

describe('RequestErrorStateBlock (#939)', () => {
  describe('primary success path', () => {
    it('renders a failed-request block with message, status code, and retry', () => {
      const onRetry = vi.fn();

      render(
        <RequestErrorStateBlock
          error={new Error('Network timeout')}
          statusCode={503}
          requestLabel="Tournament list"
          description="Check your connection and try again."
          onRetry={onRetry}
        />,
      );

      const block = screen.getByTestId('request-error-state-block');
      expect(block).toBeInTheDocument();
      expect(block).toHaveAttribute('role', 'alert');
      expect(block).toHaveAttribute('aria-live', 'assertive');
      expect(block).toHaveAttribute('data-state', 'error');

      expect(screen.getByText('Request failed')).toBeInTheDocument();
      expect(screen.getByTestId('request-error-state-block-message')).toHaveTextContent(
        'Network timeout',
      );
      expect(screen.getByTestId('request-error-state-block-status-code')).toHaveTextContent(
        '503',
      );
      expect(screen.getByText('Check your connection and try again.')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('request-error-state-block-retry'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('supports a secondary action alongside retry', () => {
      const onSecondary = vi.fn();

      render(
        <RequestErrorStateBlock
          hasError
          message="Failed to sync wallet activity."
          onRetry={vi.fn()}
          secondaryAction={{ label: 'Open support', onClick: onSecondary }}
        />,
      );

      fireEvent.click(screen.getByTestId('request-error-state-block-secondary'));
      expect(onSecondary).toHaveBeenCalledTimes(1);
    });

    it('activates from hasError without an error object', () => {
      render(
        <RequestErrorStateBlock
          hasError
          message="Leaderboard unavailable right now."
        />,
      );

      expect(screen.getByTestId('request-error-state-block-message')).toHaveTextContent(
        'Leaderboard unavailable right now.',
      );
    });
  });

  describe('idle, retrying, disabled, and fallback behavior', () => {
    it('renders nothing when there is no active error (idle state)', () => {
      const { container } = render(<RequestErrorStateBlock />);
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing for blank string errors', () => {
      const { container } = render(<RequestErrorStateBlock error="   " />);
      expect(container.firstChild).toBeNull();
    });

    it('shows a retrying indicator and disables retry while isRetrying', () => {
      const onRetry = vi.fn();

      render(
        <RequestErrorStateBlock
          error="Service unavailable"
          isRetrying
          onRetry={onRetry}
        />,
      );

      const block = screen.getByTestId('request-error-state-block');
      expect(block).toHaveAttribute('data-state', 'retrying');
      expect(block).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByTestId('request-error-state-block-retrying')).toHaveTextContent(
        'Retrying…',
      );

      const retryButton = screen.getByTestId('request-error-state-block-retry');
      expect(retryButton).toBeDisabled();
      fireEvent.click(retryButton);
      expect(onRetry).not.toHaveBeenCalled();
    });

    it('blocks retry when disabled but keeps the error visible', () => {
      const onRetry = vi.fn();

      render(
        <RequestErrorStateBlock
          error="Forbidden"
          disabled
          onRetry={onRetry}
        />,
      );

      const block = screen.getByTestId('request-error-state-block');
      expect(block).toHaveAttribute('data-state', 'disabled');
      expect(block).toHaveAttribute('aria-disabled', 'true');
      expect(screen.getByTestId('request-error-state-block-retry')).toBeDisabled();
    });

    it('falls back to requestLabel-based copy when error details are missing', () => {
      render(
        <RequestErrorStateBlock hasError requestLabel="Active tournaments" />,
      );

      expect(screen.getByTestId('request-error-state-block-message')).toHaveTextContent(
        'Could not load Active tournaments.',
      );
    });

    it('falls back to a generic message when no error details are provided', () => {
      render(<RequestErrorStateBlock hasError />);

      expect(screen.getByTestId('request-error-state-block-message')).toHaveTextContent(
        'Something went wrong while loading data. Please try again.',
      );
    });
  });
});
