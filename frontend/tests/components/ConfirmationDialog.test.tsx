import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmationDialog } from '../../src/components/v1/ConfirmationDialog';
import '../../src/components/v1/ConfirmationDialog.css';

describe('ConfirmationDialog', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('does not render when isOpen is false', () => {
      render(
        <ConfirmationDialog
          isOpen={false}
          title="Test Dialog"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          testId="test-dialog"
        />
      );

      expect(screen.queryByTestId('test-dialog')).not.toBeInTheDocument();
    });

    it('renders when isOpen is true', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Test Dialog"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          testId="test-dialog"
        />
      );

      expect(screen.getByTestId('test-dialog')).toBeInTheDocument();
    });

    it('displays title and description', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Delete Item?"
          description="This action cannot be undone."
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          testId="test-dialog"
        />
      );

      expect(screen.getByText('Delete Item?')).toBeInTheDocument();
      expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
    });

    it('displays default button labels', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Confirm?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          testId="test-dialog"
        />
      );

      expect(screen.getByText('Confirm')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('displays custom button labels', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Delete?"
          confirmLabel="Delete"
          cancelLabel="Keep It"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          testId="test-dialog"
        />
      );

      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Keep It')).toBeInTheDocument();
    });
  });

  describe('button actions', () => {
    it('calls onConfirm when confirm button is clicked', async () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Confirm?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          testId="test-dialog"
        />
      );

      const confirmButton = screen.getByTestId('test-dialog-confirm-button');
      fireEvent.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledOnce();
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('calls onCancel when cancel button is clicked', async () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Confirm?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          testId="test-dialog"
        />
      );

      const cancelButton = screen.getByTestId('test-dialog-cancel-button');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledOnce();
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });
  });

  describe('keyboard interactions', () => {
    it('calls onCancel on Escape key', () => {
      const { container } = render(
        <ConfirmationDialog
          isOpen={true}
          title="Confirm?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          testId="test-dialog"
        />
      );

      const dialog = screen.getByTestId('test-dialog');
      fireEvent.keyDown(dialog, { key: 'Escape' });

      expect(mockOnCancel).toHaveBeenCalledOnce();
    });

    it('calls onConfirm on Enter key', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Confirm?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          testId="test-dialog"
        />
      );

      const dialog = screen.getByTestId('test-dialog');
      fireEvent.keyDown(dialog, { key: 'Enter' });

      expect(mockOnConfirm).toHaveBeenCalledOnce();
    });

    it('does not call onConfirm on Enter when isConfirming is true', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Confirm?"
          isConfirming={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          testId="test-dialog"
        />
      );

      const dialog = screen.getByTestId('test-dialog');
      fireEvent.keyDown(dialog, { key: 'Enter' });

      expect(mockOnConfirm).not.toHaveBeenCalled();
    });
  });

  describe('backdrop click', () => {
    it('calls onCancel when backdrop is clicked', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Confirm?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          testId="test-dialog"
        />
      );

      const backdrop = screen.getByTestId('test-dialog-backdrop');
      fireEvent.click(backdrop);

      expect(mockOnCancel).toHaveBeenCalledOnce();
    });

    it('does not call onCancel when dialog content is clicked', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Confirm?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          testId="test-dialog"
        />
      );

      const dialog = screen.getByTestId('test-dialog');
      fireEvent.click(dialog);

      expect(mockOnCancel).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('disables buttons when isConfirming is true', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Confirm?"
          isConfirming={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          testId="test-dialog"
        />
      );

      const confirmButton = screen.getByTestId('test-dialog-confirm-button');
      const cancelButton = screen.getByTestId('test-dialog-cancel-button');

      expect(confirmButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    it('updates confirm button label when confirmingLabel is provided', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Delete?"
          confirmLabel="Delete"
          confirmingLabel="Deleting..."
          isConfirming={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          testId="test-dialog"
        />
      );

      expect(screen.getByText('Deleting...')).toBeInTheDocument();
    });

    it('sets aria-busy on confirm button when confirming', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Confirm?"
          isConfirming={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          testId="test-dialog"
        />
      );

      const confirmButton = screen.getByTestId('test-dialog-confirm-button');
      expect(confirmButton).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('accessibility', () => {
    it('has alertdialog role', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Confirm?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          testId="test-dialog"
        />
      );

      const dialog = screen.getByTestId('test-dialog');
      expect(dialog).toHaveAttribute('role', 'alertdialog');
    });

    it('links aria-labelledby to title', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Confirm Action?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          testId="test-dialog"
        />
      );

      const dialog = screen.getByTestId('test-dialog');
      const labelledBy = dialog.getAttribute('aria-labelledby');
      const titleElement = screen.getByTestId('test-dialog-title');

      expect(labelledBy).toBe(titleElement.id);
    });

    it('links aria-describedby to description', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Confirm?"
          description="Are you sure?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          testId="test-dialog"
        />
      );

      const dialog = screen.getByTestId('test-dialog');
      const describedBy = dialog.getAttribute('aria-describedby');
      const descElement = screen.getByTestId('test-dialog-description');

      expect(describedBy).toBe(descElement.id);
    });
  });

  describe('confirm button variants', () => {
    it('applies primary variant class by default', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Confirm?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          testId="test-dialog"
        />
      );

      const confirmButton = screen.getByTestId('test-dialog-confirm-button');
      expect(confirmButton).toHaveClass('confirmation-dialog__button--primary');
    });

    it('applies danger variant class when specified', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Delete?"
          confirmVariant="danger"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          testId="test-dialog"
        />
      );

      const confirmButton = screen.getByTestId('test-dialog-confirm-button');
      expect(confirmButton).toHaveClass('confirmation-dialog__button--danger');
    });

    it('applies secondary variant class when specified', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          title="Confirm?"
          confirmVariant="secondary"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          testId="test-dialog"
        />
      );

      const confirmButton = screen.getByTestId('test-dialog-confirm-button');
      expect(confirmButton).toHaveClass('confirmation-dialog__button--secondary');
    });
  });
});
