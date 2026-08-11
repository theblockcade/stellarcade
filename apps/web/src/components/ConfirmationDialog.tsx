"use client";

import React, { useRef, useId } from "react";
import { useFocusTrap } from "./modal-stack";
import "./ConfirmationDialog.css";

export interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "danger" | "secondary";
  onConfirm: () => void;
  onCancel: () => void;
  isConfirming?: boolean;
  confirmingLabel?: string;
  className?: string;
  testId?: string;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "primary",
  onConfirm,
  onCancel,
  isConfirming = false,
  confirmingLabel,
  className = "",
  testId = "confirmation-dialog",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useFocusTrap(containerRef, isOpen);

  if (!isOpen) return null;

  const confirmButtonLabel = isConfirming && confirmingLabel ? confirmingLabel : confirmLabel;

  return (
    <div
      className="confirmation-dialog-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      data-testid={`${testId}-backdrop`}
      role="presentation"
    >
      <div
        ref={containerRef}
        className={`confirmation-dialog ${className}`.trim()}
        data-testid={testId}
        role="alertdialog"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <div className="confirmation-dialog__header">
          <h2
            id={titleId}
            className="confirmation-dialog__title"
            data-testid={`${testId}-title`}
          >
            {title}
          </h2>
        </div>

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

ConfirmationDialog.displayName = "ConfirmationDialog";
export default ConfirmationDialog;
