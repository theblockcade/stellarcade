import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PreferenceDraftIndicator } from '../../src/components/v1/PreferenceDraftIndicator';

describe('PreferenceDraftIndicator', () => {
  it('renders nothing when hasDraft is false', () => {
    const { container } = render(<PreferenceDraftIndicator hasDraft={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the indicator when hasDraft is true', () => {
    render(<PreferenceDraftIndicator hasDraft={true} />);
    expect(screen.getByTestId('preference-draft-indicator')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders a custom label', () => {
    render(<PreferenceDraftIndicator hasDraft={true} label="Unsaved Settings" />);
    expect(screen.getByText('Unsaved Settings')).toBeInTheDocument();
  });

  it('renders action buttons and handles clicks', () => {
    const handleResume = vi.fn();
    const handleDiscard = vi.fn();

    render(
      <PreferenceDraftIndicator
        hasDraft={true}
        onResume={handleResume}
        onDiscard={handleDiscard}
        sectionId="test-section"
      />
    );

    const resumeBtn = screen.getByTestId('test-section-draft-resume');
    const discardBtn = screen.getByTestId('test-section-draft-discard');

    expect(resumeBtn).toBeInTheDocument();
    expect(discardBtn).toBeInTheDocument();

    fireEvent.click(resumeBtn);
    expect(handleResume).toHaveBeenCalledTimes(1);

    fireEvent.click(discardBtn);
    expect(handleDiscard).toHaveBeenCalledTimes(1);
  });

  it('only renders provided actions', () => {
    render(
      <PreferenceDraftIndicator
        hasDraft={true}
        onDiscard={() => {}}
        sectionId="test-section"
      />
    );

    expect(screen.queryByTestId('test-section-draft-resume')).not.toBeInTheDocument();
    expect(screen.getByTestId('test-section-draft-discard')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<PreferenceDraftIndicator hasDraft={true} className="custom-class" />);
    expect(screen.getByTestId('preference-draft-indicator')).toHaveClass('custom-class');
  });
});
