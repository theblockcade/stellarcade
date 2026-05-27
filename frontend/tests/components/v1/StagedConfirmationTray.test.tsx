import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StagedConfirmationTray } from '../../../src/components/v1/StagedConfirmationTray';
import type { ConfirmationField } from '../../../src/components/v1/StagedConfirmationTray';

const fields: ConfirmationField[] = [
  { label: 'Amount', value: '100 XLM', sensitive: true },
  { label: 'Recipient', value: 'GA...XYZ' },
];

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  onConfirm: vi.fn().mockResolvedValue(undefined),
  title: 'Send XLM',
  fields,
};

describe('StagedConfirmationTray', () => {
  describe('Rendering', () => {
    it('renders nothing when open is false', () => {
      render(<StagedConfirmationTray {...defaultProps} open={false} />);
      expect(screen.queryByTestId('staged-confirmation-tray')).not.toBeInTheDocument();
    });

    it('renders tray when open is true', () => {
      render(<StagedConfirmationTray {...defaultProps} />);
      expect(screen.getByTestId('staged-confirmation-tray')).toBeInTheDocument();
    });

    it('shows title', () => {
      render(<StagedConfirmationTray {...defaultProps} />);
      expect(screen.getByText('Send XLM')).toBeInTheDocument();
    });

    it('shows risk level badge', () => {
      render(<StagedConfirmationTray {...defaultProps} riskLevel="high" />);
      expect(screen.getByTestId('staged-confirmation-tray-risk')).toHaveTextContent('high risk');
    });

    it('has dialog role and aria-modal', () => {
      render(<StagedConfirmationTray {...defaultProps} />);
      const tray = screen.getByTestId('staged-confirmation-tray');
      expect(tray).toHaveAttribute('role', 'dialog');
      expect(tray).toHaveAttribute('aria-modal', 'true');
    });
  });

  describe('Review stage', () => {
    it('starts on review stage', () => {
      render(<StagedConfirmationTray {...defaultProps} />);
      expect(screen.getByTestId('staged-confirmation-tray-stage-review')).toBeInTheDocument();
    });

    it('renders all fields', () => {
      render(<StagedConfirmationTray {...defaultProps} />);
      expect(screen.getByText('Amount')).toBeInTheDocument();
      expect(screen.getByText('100 XLM')).toBeInTheDocument();
      expect(screen.getByText('Recipient')).toBeInTheDocument();
    });

    it('calls onClose when Cancel is clicked', () => {
      const onClose = vi.fn();
      render(<StagedConfirmationTray {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByTestId('staged-confirmation-tray-cancel'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('advances to confirm stage on Continue click', () => {
      render(<StagedConfirmationTray {...defaultProps} />);
      fireEvent.click(screen.getByTestId('staged-confirmation-tray-next'));
      expect(screen.getByTestId('staged-confirmation-tray-stage-confirm')).toBeInTheDocument();
    });

    it('dismisses on Escape key during review', () => {
      const onClose = vi.fn();
      render(<StagedConfirmationTray {...defaultProps} onClose={onClose} />);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Confirm stage', () => {
    function advanceToConfirm() {
      render(<StagedConfirmationTray {...defaultProps} />);
      fireEvent.click(screen.getByTestId('staged-confirmation-tray-next'));
    }

    it('submit button is disabled without checkbox', () => {
      advanceToConfirm();
      expect(screen.getByTestId('staged-confirmation-tray-submit')).toBeDisabled();
    });

    it('submit button enables after checkbox is checked', () => {
      advanceToConfirm();
      fireEvent.click(screen.getByTestId('staged-confirmation-tray-checkbox'));
      expect(screen.getByTestId('staged-confirmation-tray-submit')).not.toBeDisabled();
    });

    it('can go back to review stage', () => {
      advanceToConfirm();
      fireEvent.click(screen.getByTestId('staged-confirmation-tray-back'));
      expect(screen.getByTestId('staged-confirmation-tray-stage-review')).toBeInTheDocument();
    });
  });

  describe('Done stage — success path', () => {
    async function advanceToDone(onConfirm = vi.fn().mockResolvedValue(undefined)) {
      render(<StagedConfirmationTray {...defaultProps} onConfirm={onConfirm} />);
      fireEvent.click(screen.getByTestId('staged-confirmation-tray-next'));
      fireEvent.click(screen.getByTestId('staged-confirmation-tray-checkbox'));
      fireEvent.click(screen.getByTestId('staged-confirmation-tray-submit'));
    }

    it('shows processing state after submit', async () => {
      const onConfirm = vi.fn(() => new Promise(() => {})); // never resolves
      await advanceToDone(onConfirm);
      expect(screen.getByTestId('staged-confirmation-tray-stage-done')).toBeInTheDocument();
    });

    it('shows success message after confirmation resolves', async () => {
      await advanceToDone();
      await waitFor(() =>
        expect(screen.getByTestId('staged-confirmation-tray-success')).toBeInTheDocument()
      );
    });

    it('shows error message when confirmation rejects', async () => {
      const onConfirm = vi.fn().mockRejectedValue(new Error('tx failed'));
      await advanceToDone(onConfirm);
      await waitFor(() =>
        expect(screen.getByTestId('staged-confirmation-tray-error')).toBeInTheDocument()
      );
    });
  });

  describe('Edge cases', () => {
    it('resets to review stage on reopen', () => {
      const { rerender } = render(<StagedConfirmationTray {...defaultProps} />);
      fireEvent.click(screen.getByTestId('staged-confirmation-tray-next'));
      rerender(<StagedConfirmationTray {...defaultProps} open={false} />);
      rerender(<StagedConfirmationTray {...defaultProps} open={true} />);
      expect(screen.getByTestId('staged-confirmation-tray-stage-review')).toBeInTheDocument();
    });
  });
});
