/**
 * @vitest-environment happy-dom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DraftPresenceIndicator } from '@/components/v1/DraftPresenceIndicator';

describe('DraftPresenceIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Primary Success Path', () => {
    it('renders with saving status', () => {
      render(
        <DraftPresenceIndicator
          draftId="draft-1"
          moduleName="Dashboard Widget"
          status="saving"
        />
      );

      expect(screen.getByTestId('draft-presence-indicator')).toBeInTheDocument();
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(screen.getByTestId('draft-presence-indicator')).toHaveAttribute('aria-live', 'polite');
    });

    it('renders with saved status', () => {
      render(
        <DraftPresenceIndicator
          draftId="draft-1"
          moduleName="Dashboard Widget"
          status="saved"
        />
      );

      expect(screen.getByText('Draft saved')).toBeInTheDocument();
    });

    it('renders with conflict status and resolve button', () => {
      const onResume = vi.fn();
      render(
        <DraftPresenceIndicator
          draftId="draft-1"
          moduleName="Dashboard Widget"
          status="conflict"
          onResume={onResume}
        />
      );

      expect(screen.getByText('Draft has conflicts')).toBeInTheDocument();
      const resolveBtn = screen.getByTestId('draft-presence-indicator-resolve');
      fireEvent.click(resolveBtn);
      expect(onResume).toHaveBeenCalledTimes(1);
    });

    it('renders discard button and handles click', () => {
      const onDiscard = vi.fn();
      render(
        <DraftPresenceIndicator
          draftId="draft-1"
          moduleName="Dashboard Widget"
          status="saved"
          onDiscard={onDiscard}
        />
      );

      const discardBtn = screen.getByTestId('draft-presence-indicator-discard');
      fireEvent.click(discardBtn);
      expect(onDiscard).toHaveBeenCalledTimes(1);
    });

    it('shows relative time for stale status', () => {
      const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
      render(
        <DraftPresenceIndicator
          draftId="draft-1"
          moduleName="Dashboard Widget"
          status="stale"
          lastEditedAt={twoHoursAgo}
        />
      );

      expect(screen.getByText('2h ago')).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Fallback Behavior', () => {
    it('renders nothing when status is idle', () => {
      const { container } = render(
        <DraftPresenceIndicator
          draftId="draft-1"
          moduleName="Dashboard Widget"
          status="idle"
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when draftId is empty', () => {
      const { container } = render(
        <DraftPresenceIndicator
          draftId=""
          moduleName="Dashboard Widget"
          status="saved"
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('sets correct data-status attribute', () => {
      render(
        <DraftPresenceIndicator
          draftId="draft-1"
          moduleName="Dashboard Widget"
          status="conflict"
        />
      );

      expect(screen.getByTestId('draft-presence-indicator')).toHaveAttribute('data-status', 'conflict');
    });

    it('applies custom className', () => {
      render(
        <DraftPresenceIndicator
          draftId="draft-1"
          moduleName="Dashboard Widget"
          status="saved"
          className="custom-class"
        />
      );

      expect(screen.getByTestId('draft-presence-indicator')).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('has correct aria-label', () => {
      render(
        <DraftPresenceIndicator
          draftId="draft-1"
          moduleName="Dashboard Widget"
          status="saved"
        />
      );

      expect(screen.getByTestId('draft-presence-indicator')).toHaveAttribute(
        'aria-label',
        'Dashboard Widget: Draft saved'
      );
    });

    it('has role=status', () => {
      render(
        <DraftPresenceIndicator
          draftId="draft-1"
          moduleName="Dashboard Widget"
          status="saved"
        />
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});
