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

  describe('Edge cases and fallback behavior', () => {
    it('shows spinner when isSaving is true', () => {
      render(<PreferenceDraftIndicator hasDraft={true} isSaving />);
      
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      const indicator = screen.getByTestId('preference-draft-indicator');
      expect(indicator.querySelector('.preference-draft-indicator__spinner')).toBeInTheDocument();
    });

    it('disables actions when isSaving is true', () => {
      render(
        <PreferenceDraftIndicator
          hasDraft={true}
          isSaving
          onResume={() => {}}
          onDiscard={() => {}}
          sectionId="test-section"
        />
      );

      const resumeBtn = screen.getByTestId('test-section-draft-resume');
      const discardBtn = screen.getByTestId('test-section-draft-discard');
      
      expect(resumeBtn).toBeDisabled();
      expect(discardBtn).toBeDisabled();
    });

    it('disables actions when disabled is true', () => {
      render(
        <PreferenceDraftIndicator
          hasDraft={true}
          disabled
          onResume={() => {}}
          onDiscard={() => {}}
          sectionId="test-section"
        />
      );

      const resumeBtn = screen.getByTestId('test-section-draft-resume');
      const discardBtn = screen.getByTestId('test-section-draft-discard');
      
      expect(resumeBtn).toBeDisabled();
      expect(discardBtn).toBeDisabled();
    });

    it('shows disabled reason when disabled with reason', () => {
      render(
        <PreferenceDraftIndicator
          hasDraft={true}
          disabled
          disabledReason="Connection lost"
          onDiscard={() => {}}
          sectionId="test-section"
        />
      );

      expect(screen.getByText('Connection lost')).toBeInTheDocument();
    });

    it('displays relative time when lastModified is provided', () => {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      render(<PreferenceDraftIndicator hasDraft={true} lastModified={oneHourAgo} />);
      
      expect(screen.getByText('1h ago')).toBeInTheDocument();
    });

    it('does not display time when isSaving is true', () => {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      render(<PreferenceDraftIndicator hasDraft={true} isSaving lastModified={oneHourAgo} />);
      
      expect(screen.queryByText('1h ago')).not.toBeInTheDocument();
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA role', () => {
      render(<PreferenceDraftIndicator hasDraft={true} />);
      
      expect(screen.getByTestId('preference-draft-indicator')).toHaveAttribute('role', 'status');
    });

    it('has aria-busy when isSaving is true', () => {
      render(<PreferenceDraftIndicator hasDraft={true} isSaving />);
      
      expect(screen.getByTestId('preference-draft-indicator')).toHaveAttribute('aria-busy', 'true');
    });

    it('has aria-describedby for disabled reason', () => {
      render(
        <PreferenceDraftIndicator
          hasDraft={true}
          disabled
          disabledReason="Connection lost"
          onDiscard={() => {}}
          sectionId="test-section"
        />
      );

      const discardBtn = screen.getByTestId('test-section-draft-discard');
      expect(discardBtn).toHaveAttribute('aria-describedby', 'test-section-disabled-reason');
    });

    it('has aria-label on action buttons', () => {
      render(
        <PreferenceDraftIndicator
          hasDraft={true}
          onResume={() => {}}
          onDiscard={() => {}}
          sectionId="test-section"
        />
      );

      expect(screen.getByTestId('test-section-draft-resume')).toHaveAttribute('aria-label', 'Resume draft');
      expect(screen.getByTestId('test-section-draft-discard')).toHaveAttribute('aria-label', 'Discard draft');
    });
  });
});
