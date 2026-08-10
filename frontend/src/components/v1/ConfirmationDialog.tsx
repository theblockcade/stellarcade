import React, { useRef, useId } from 'react';
import { useFocusTrap } from './modal-stack';
import './ConfirmationDialog.css';

/**
 * ConfirmationDialog - Reusable confirmation modal component.
 *
 * Provides accessible confirmation/cancellation workflow:
 * - Focus trap to prevent tabbing outside the modal
 * - Keyboard support (Enter to confirm, Escape to cancel)
 * - ARIA attributes for screen readers
 * - Responsive design with backdrop
 * - Optional destructive action styling
 *
 * Usage:
 * <ConfirmationDialog
 *   isOpen={showDialog}
 *   title="Delete Item?"
 *   description="This action cannot be undone."
 *   confirmLabel="Delete"
 *   confirmVariant="danger"
 *   onConfirm={handleDelete}
 *   onCancel={handleCancel}
 * />
 */

export interface ConfirmationDialogProps {
  /** Whether the dialog is currently open. */
  isOpen: boolean;
  /** Title of the confirmation dialog. */
  title: string;
  /** Optional detailed description. */
  description?: string;
  /** Label for the confirm/action button. Default: 'Confirm' */
  confirmLabel?: string;
  /** Label for the cancel button. Default: 'Cancel' */
  cancelLabel?: string;
  /** Visual variant for the confirm button: 'primary' | 'danger' | 'secondary'. */
  confirmVariant?: 'primary' | 'danger' | 'secondary';
  /** Callback when user confirms. */
  onConfirm: () => void;
  /** Callback when user cancels or closes the dialog. */
  onCancel: () => void;
  /** Whether the confirm button is in a loading state. */
  isConfirming?: boolean;
  /** Optional label override when confirming. */
  confirmingLabel?: string;
  /** Custom CSS class for the dialog. */
  className?: string;
  /** Test ID for component testing. */
  testId?: string;
  /** If true, renders the dialog even when isOpen is false (for animation). */
  isTransitioning?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
  isConfirming = false,
  confirmingLabel,
  className = '',
  testId = 'confirmation-dialog',
  isTransitioning = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  // Enable focus trap when dialog is open
  useFocusTrap(containerRef, isOpen);

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Enter') {
      // Only confirm on Enter if we're not already confirming and no input is focused
      const isInputFocused =
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA';
      if (!isConfirming && !isInputFocused) {
        e.preventDefault();
        onConfirm();
      }
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  // Don't render if not open and not transitioning
  if (!isOpen && !isTransitioning) {
    return null;
  }

  const confirmButtonLabel = isConfirming && confirmingLabel ? confirmingLabel : confirmLabel;
  const isVisible = isOpen && !isTransitioning;

  return (
    <div
      className={`confirmation-dialog-backdrop ${isVisible ? 'confirmation-dialog-backdrop--visible' : ''}`}
      onClick={handleBackdropClick}
      data-testid={`${testId}-backdrop`}
      role="presentation"
      aria-hidden={!isOpen}
    >
      <div
        ref={containerRef}
        className={`confirmation-dialog ${className}`.trim()}
        data-testid={testId}
        role="alertdialog"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="confirmation-dialog__header">
          <h1
            id={titleId}
            className="confirmation-dialog__title"
            data-testid={`${testId}-title`}
          >
            {title}
          </h1>
        </div>

        {/* Body */}
        {description && (
          <div className="confirmation-dialog__body">
            <p
              id={descriptionId}
              className="confirmation-dialog__description"
              data-testid={`${testId}-description`}
            >
              {description}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="confirmation-dialog__footer">
          <button
            type="button"
            className="confirmation-dialog__button confirmation-dialog__button--secondary"
            onClick={onCancel}
            disabled={isConfirming}
            data-testid={`${testId}-cancel-button`}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`confirmation-dialog__button confirmation-dialog__button--${confirmVariant}`}
            onClick={onConfirm}
            disabled={isConfirming}
            aria-busy={isConfirming}
            data-testid={`${testId}-confirm-button`}
          >
            {confirmButtonLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

ConfirmationDialog.displayName = 'ConfirmationDialog';
export default ConfirmationDialog;
