import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TxPendingOverlay } from '../../src/components/v1/TxPendingOverlay';

describe('TxPendingOverlay', () => {
  it('renders nothing when visible is false', () => {
    render(
      <TxPendingOverlay visible={false} testId="tx-overlay" />,
    );
    expect(screen.queryByTestId('tx-overlay')).not.toBeInTheDocument();
  });

  it('renders with default message when visible is true', () => {
    render(
      <TxPendingOverlay visible={true} testId="tx-overlay" />,
    );
    const overlay = screen.getByTestId('tx-overlay');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveAttribute('role', 'status');
    expect(overlay).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByTestId('tx-overlay-message')).toHaveTextContent(
      'Transaction in progress…',
    );
  });

  it('renders with custom message when provided', () => {
    render(
      <TxPendingOverlay
        visible={true}
        message="Submitting your order…"
        testId="tx-overlay"
      />,
    );
    expect(screen.getByTestId('tx-overlay-message')).toHaveTextContent(
      'Submitting your order…',
    );
  });

  it('shows truncated txHash when provided', () => {
    render(
      <TxPendingOverlay
        visible={true}
        txHash="abcdef1234567890abcdef1234567890"
        testId="tx-overlay"
      />,
    );
    const hashEl = screen.getByTestId('tx-overlay-hash');
    expect(hashEl).toBeInTheDocument();
    expect(hashEl).toHaveTextContent('abcdef12');
  });

  it('does not render hash element when txHash is not provided', () => {
    render(<TxPendingOverlay visible={true} testId="tx-overlay" />);
    expect(screen.queryByTestId('tx-overlay-hash')).not.toBeInTheDocument();
  });

  it('shows cancel button when onCancel is provided', () => {
    const onCancel = vi.fn();
    render(
      <TxPendingOverlay visible={true} onCancel={onCancel} testId="tx-overlay" />,
    );
    expect(screen.getByTestId('tx-overlay-cancel')).toBeInTheDocument();
  });

  it('does not show cancel button when onCancel is not provided', () => {
    render(<TxPendingOverlay visible={true} testId="tx-overlay" />);
    expect(screen.queryByTestId('tx-overlay-cancel')).not.toBeInTheDocument();
  });

  it('cancel button is initially enabled', () => {
    const onCancel = vi.fn();
    render(
      <TxPendingOverlay visible={true} onCancel={onCancel} testId="tx-overlay" />,
    );
    const btn = screen.getByTestId('tx-overlay-cancel');
    expect(btn).not.toBeDisabled();
  });

  it('shows spinner', () => {
    render(<TxPendingOverlay visible={true} testId="tx-overlay" />);
    expect(screen.getByTestId('tx-overlay-spinner')).toBeInTheDocument();
  });
});
