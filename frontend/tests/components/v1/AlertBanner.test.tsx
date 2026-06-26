/**
 * @vitest-environment happy-dom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { AlertBanner } from '../../../src/components/v1/AlertBanner';

describe('AlertBanner', () => {
  it('renders the message and defaults to info variant', () => {
    render(<AlertBanner message="System is running smoothly" />);

    expect(screen.getByText('System is running smoothly')).toBeInTheDocument();
    const banner = screen.getByTestId('alert-banner');
    expect(banner).toHaveClass('alert-banner--info');
    expect(banner).toHaveAttribute('role', 'status');
    expect(banner).toHaveAttribute('aria-live', 'polite');
  });

  it('renders custom title when provided', () => {
    render(<AlertBanner message="Operation succeeded" title="Success Title" variant="success" />);

    expect(screen.getByTestId('alert-banner-title')).toHaveTextContent('Success Title');
    expect(screen.getByText('Operation succeeded')).toBeInTheDocument();
    const banner = screen.getByTestId('alert-banner');
    expect(banner).toHaveClass('alert-banner--success');
    expect(banner).toHaveAttribute('role', 'status');
    expect(banner).toHaveAttribute('aria-live', 'polite');
  });

  it('renders error and warning variants with role alert', () => {
    const { rerender } = render(<AlertBanner message="Critical failure" variant="error" />);
    
    let banner = screen.getByTestId('alert-banner');
    expect(banner).toHaveClass('alert-banner--error');
    expect(banner).toHaveAttribute('role', 'alert');
    expect(banner).toHaveAttribute('aria-live', 'assertive');

    rerender(<AlertBanner message="Potential issue" variant="warning" />);
    banner = screen.getByTestId('alert-banner');
    expect(banner).toHaveClass('alert-banner--warning');
    expect(banner).toHaveAttribute('role', 'alert');
    expect(banner).toHaveAttribute('aria-live', 'assertive');
  });

  it('handles single action click', () => {
    const onClick = vi.fn();
    render(
      <AlertBanner
        message="A new update is available"
        action={{ label: 'Update Now', onClick }}
      />
    );

    const actionBtn = screen.getByTestId('alert-banner-action-0');
    expect(actionBtn).toHaveTextContent('Update Now');
    fireEvent.click(actionBtn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('handles multiple actions click', () => {
    const onClick1 = vi.fn();
    const onClick2 = vi.fn();
    render(
      <AlertBanner
        message="Review needed"
        actions={[
          { label: 'Accept', onClick: onClick1, testId: 'btn-accept' },
          { label: 'Reject', onClick: onClick2, testId: 'btn-reject' }
        ]}
      />
    );

    const acceptBtn = screen.getByTestId('btn-accept');
    const rejectBtn = screen.getByTestId('btn-reject');
    
    fireEvent.click(acceptBtn);
    expect(onClick1).toHaveBeenCalledTimes(1);
    expect(onClick2).not.toHaveBeenCalled();

    fireEvent.click(rejectBtn);
    expect(onClick2).toHaveBeenCalledTimes(1);
  });

  it('does not render actions when they are empty', () => {
    render(<AlertBanner message="No actions" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('handles dismiss button click', () => {
    const onDismiss = vi.fn();
    render(<AlertBanner message="Dismissible banner" onDismiss={onDismiss} />);

    const dismissBtn = screen.getByTestId('alert-banner-dismiss');
    expect(dismissBtn).toBeInTheDocument();
    expect(dismissBtn).toHaveAttribute('aria-label', 'Dismiss alert');

    fireEvent.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('returns null (renders nothing) when message is absent and not loading', () => {
    const { container } = render(<AlertBanner message="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('supports custom icon rendering', () => {
    render(
      <AlertBanner
        message="Custom Icon"
        icon={<span data-testid="custom-icon">🔥</span>}
      />
    );
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('disables controls when isDisabled is true', () => {
    const onClick = vi.fn();
    const onDismiss = vi.fn();
    render(
      <AlertBanner
        message="Disabled state"
        action={{ label: 'Click', onClick }}
        onDismiss={onDismiss}
        isDisabled={true}
      />
    );

    const actionBtn = screen.getByTestId('alert-banner-action-0');
    const dismissBtn = screen.getByTestId('alert-banner-dismiss');

    expect(actionBtn).toBeDisabled();
    expect(dismissBtn).toBeDisabled();

    fireEvent.click(actionBtn);
    fireEvent.click(dismissBtn);

    expect(onClick).not.toHaveBeenCalled();
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('disables a specific action when the action is disabled', () => {
    const onClick = vi.fn();
    render(
      <AlertBanner
        message="Disabled action"
        actions={[
          { label: 'Enabled', onClick },
          { label: 'Disabled', onClick, disabled: true, testId: 'disabled-action' }
        ]}
      />
    );

    const enabledBtn = screen.getByTestId('alert-banner-action-0');
    const disabledBtn = screen.getByTestId('disabled-action');

    expect(enabledBtn).not.toBeDisabled();
    expect(disabledBtn).toBeDisabled();
  });

  it('handles loading state inside action button', () => {
    const onClick = vi.fn();
    render(
      <AlertBanner
        message="Loading action"
        action={{ label: 'Process', onClick, loading: true }}
      />
    );

    const actionBtn = screen.getByTestId('alert-banner-action-0');
    expect(actionBtn).toBeDisabled();
    expect(actionBtn.querySelector('.alert-banner__spinner')).toBeInTheDocument();

    fireEvent.click(actionBtn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders skeleton lines and loader classes when isLoading is true', () => {
    render(<AlertBanner message="Loading Banner" isLoading={true} />);

    const banner = screen.getByTestId('alert-banner');
    expect(banner).toHaveClass('alert-banner--loading');

    expect(banner.querySelector('.alert-banner__skeleton-icon')).toBeInTheDocument();
    expect(banner.querySelector('.alert-banner__skeleton-text')).toBeInTheDocument();
    expect(banner.querySelector('.alert-banner__skeleton-line--title')).toBeInTheDocument();
    expect(banner.querySelector('.alert-banner__skeleton-line--body')).toBeInTheDocument();
  });

  it('applies sticky positions classes correctly', () => {
    const { rerender } = render(<AlertBanner message="Sticky Top" position="sticky-top" />);
    let banner = screen.getByTestId('alert-banner');
    expect(banner).toHaveClass('alert-banner--sticky-top');

    rerender(<AlertBanner message="Sticky Bottom" position="sticky-bottom" />);
    banner = screen.getByTestId('alert-banner');
    expect(banner).toHaveClass('alert-banner--sticky-bottom');
  });
});
