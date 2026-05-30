import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { InlineAlertTray } from '../../src/components/v1/InlineAlertTray';

describe('InlineAlertTray', () => {
  it('renders the message correctly', () => {
    render(<InlineAlertTray message="This is an alert" />);
    expect(screen.getByText('This is an alert')).toBeInTheDocument();
    expect(screen.getByTestId('inline-alert-tray')).toHaveClass('inline-alert-tray--info');
  });

  it('renders with different variants', () => {
    const { rerender } = render(<InlineAlertTray message="Alert" variant="success" />);
    expect(screen.getByTestId('inline-alert-tray')).toHaveClass('inline-alert-tray--success');

    rerender(<InlineAlertTray message="Alert" variant="error" />);
    expect(screen.getByTestId('inline-alert-tray')).toHaveClass('inline-alert-tray--error');
    expect(screen.getByTestId('inline-alert-tray')).toHaveAttribute('role', 'alert');

    rerender(<InlineAlertTray message="Alert" variant="warning" />);
    expect(screen.getByTestId('inline-alert-tray')).toHaveClass('inline-alert-tray--warning');
    expect(screen.getByTestId('inline-alert-tray')).toHaveAttribute('role', 'alert');
  });

  it('renders an action button and handles clicks', () => {
    const handleActionClick = vi.fn();
    render(
      <InlineAlertTray
        message="Actionable alert"
        action={{ label: 'Retry', onClick: handleActionClick }}
      />
    );

    const actionBtn = screen.getByTestId('inline-alert-tray-action');
    expect(actionBtn).toBeInTheDocument();
    expect(actionBtn).toHaveTextContent('Retry');

    fireEvent.click(actionBtn);
    expect(handleActionClick).toHaveBeenCalledTimes(1);
  });

  it('renders a disabled action button', () => {
    render(
      <InlineAlertTray
        message="Actionable alert"
        action={{ label: 'Retry', onClick: () => {}, disabled: true }}
      />
    );

    const actionBtn = screen.getByTestId('inline-alert-tray-action');
    expect(actionBtn).toBeDisabled();
  });

  it('renders a dismiss button and handles clicks', () => {
    const handleDismiss = vi.fn();
    render(
      <InlineAlertTray
        message="Dismissible alert"
        onDismiss={handleDismiss}
      />
    );

    const dismissBtn = screen.getByTestId('inline-alert-tray-dismiss');
    expect(dismissBtn).toBeInTheDocument();

    fireEvent.click(dismissBtn);
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('applies the flush integration style', () => {
    render(<InlineAlertTray message="Flush alert" integration="flush" />);
    expect(screen.getByTestId('inline-alert-tray')).toHaveClass('inline-alert-tray--flush');
  });
});
