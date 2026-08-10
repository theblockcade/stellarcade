/**
 * @vitest-environment happy-dom
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it } from 'vitest';
import { StatusRibbon, type StatusVariant } from '@/components/v1/StatusRibbon';

describe('StatusRibbon (#1004)', () => {
  // ---------------------------------------------------------------------------
  // Default labels
  // ---------------------------------------------------------------------------
  it('renders default "Active" label for active status', () => {
    render(<StatusRibbon status="active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders default "Pending" label for pending status', () => {
    render(<StatusRibbon status="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders default "Inactive" label for inactive status', () => {
    render(<StatusRibbon status="inactive" />);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('renders default "Error" label for error status', () => {
    render(<StatusRibbon status="error" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('renders default "Success" label for success status', () => {
    render(<StatusRibbon status="success" />);
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Custom label
  // ---------------------------------------------------------------------------
  it('renders custom label when provided', () => {
    render(<StatusRibbon status="active" label="Currently Online" />);
    expect(screen.getByText('Currently Online')).toBeInTheDocument();
  });

  it('custom label overrides default label', () => {
    render(<StatusRibbon status="error" label="Connection Failed" />);
    expect(screen.getByText('Connection Failed')).toBeInTheDocument();
    expect(screen.queryByText('Error')).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Pulse animation
  // ---------------------------------------------------------------------------
  it('does not have pulse class by default', () => {
    render(<StatusRibbon status="active" />);
    const ribbon = screen.getByTestId('status-ribbon');
    expect(ribbon).not.toHaveClass('status-ribbon--pulse');
  });

  it('adds pulse class when pulse is true', () => {
    render(<StatusRibbon status="active" pulse />);
    const ribbon = screen.getByTestId('status-ribbon');
    expect(ribbon).toHaveClass('status-ribbon--pulse');
  });

  // ---------------------------------------------------------------------------
  // CSS class variants
  // ---------------------------------------------------------------------------
  it('adds status-specific CSS class', () => {
    const variants: StatusVariant[] = ['active', 'pending', 'inactive', 'error', 'success'];
    variants.forEach((variant) => {
      const { unmount } = render(<StatusRibbon status={variant} />);
      const ribbon = screen.getByTestId('status-ribbon');
      expect(ribbon).toHaveClass(`status-ribbon--${variant}`);
      unmount();
    });
  });

  it('adds custom className when provided', () => {
    render(<StatusRibbon status="active" className="my-custom-class" />);
    const ribbon = screen.getByTestId('status-ribbon');
    expect(ribbon).toHaveClass('my-custom-class');
  });

  // ---------------------------------------------------------------------------
  // Accessibility
  // ---------------------------------------------------------------------------
  it('has role="status" for assistive technology', () => {
    render(<StatusRibbon status="active" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('aria-label includes status information', () => {
    render(<StatusRibbon status="pending" />);
    const ribbon = screen.getByRole('status');
    expect(ribbon).toHaveAttribute('aria-label', 'Status: Pending');
  });

  it('aria-label uses custom label when provided', () => {
    render(<StatusRibbon status="active" label="In Queue" />);
    const ribbon = screen.getByRole('status');
    expect(ribbon).toHaveAttribute('aria-label', 'Status: In Queue');
  });

  // ---------------------------------------------------------------------------
  // Custom testId
  // ---------------------------------------------------------------------------
  it('uses custom testId when provided', () => {
    render(<StatusRibbon status="active" testId="my-status" />);
    expect(screen.getByTestId('my-status')).toBeInTheDocument();
  });
});
