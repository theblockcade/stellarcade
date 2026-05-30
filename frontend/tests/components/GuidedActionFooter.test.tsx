import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GuidedActionFooter } from '../../src/components/v1/GuidedActionFooter';

describe('GuidedActionFooter', () => {
  const primaryAction = { label: 'Submit', onClick: vi.fn() };

  it('renders primary action button', () => {
    render(<GuidedActionFooter primaryAction={primaryAction} />);
    const btn = screen.getByTestId('guided-action-footer-primary-btn');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent('Submit');
  });

  it('renders secondary and tertiary actions when provided', () => {
    render(
      <GuidedActionFooter
        primaryAction={primaryAction}
        secondaryAction={{ label: 'Back', onClick: vi.fn() }}
        tertiaryAction={{ label: 'Cancel', onClick: vi.fn() }}
      />
    );
    expect(screen.getByTestId('guided-action-footer-secondary-btn')).toHaveTextContent('Back');
    expect(screen.getByTestId('guided-action-footer-tertiary-btn')).toHaveTextContent('Cancel');
  });

  it('handles click events for all actions', () => {
    const primaryClick = vi.fn();
    const secondaryClick = vi.fn();
    const tertiaryClick = vi.fn();

    render(
      <GuidedActionFooter
        primaryAction={{ label: 'Submit', onClick: primaryClick }}
        secondaryAction={{ label: 'Back', onClick: secondaryClick }}
        tertiaryAction={{ label: 'Cancel', onClick: tertiaryClick }}
      />
    );

    fireEvent.click(screen.getByTestId('guided-action-footer-primary-btn'));
    fireEvent.click(screen.getByTestId('guided-action-footer-secondary-btn'));
    fireEvent.click(screen.getByTestId('guided-action-footer-tertiary-btn'));

    expect(primaryClick).toHaveBeenCalledTimes(1);
    expect(secondaryClick).toHaveBeenCalledTimes(1);
    expect(tertiaryClick).toHaveBeenCalledTimes(1);
  });

  it('disables buttons correctly', () => {
    render(
      <GuidedActionFooter
        primaryAction={{ ...primaryAction, disabled: true }}
        secondaryAction={{ label: 'Back', onClick: vi.fn(), disabled: true }}
        tertiaryAction={{ label: 'Cancel', onClick: vi.fn(), disabled: true }}
      />
    );

    expect(screen.getByTestId('guided-action-footer-primary-btn')).toBeDisabled();
    expect(screen.getByTestId('guided-action-footer-secondary-btn')).toBeDisabled();
    expect(screen.getByTestId('guided-action-footer-tertiary-btn')).toBeDisabled();
  });

  it('disables primary button and shows loading state', () => {
    render(
      <GuidedActionFooter
        primaryAction={{ ...primaryAction, isLoading: true }}
      />
    );

    const btn = screen.getByTestId('guided-action-footer-primary-btn');
    expect(btn).toBeDisabled();
    expect(btn).toHaveClass('guided-action-footer__btn--loading');
  });

  it('passes steps to StickyActionsFooter correctly', () => {
    const steps = [
      { id: '1', label: 'Start' },
      { id: '2', label: 'Middle' },
    ];
    render(
      <GuidedActionFooter
        primaryAction={primaryAction}
        steps={steps}
        currentStepId="2"
      />
    );
    
    // Test that StickyActionsFooter renders the progress label
    expect(screen.getByText(/Step 2 of 2/)).toBeInTheDocument();
  });
});
