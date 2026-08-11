"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";

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

const CONFIRM_BUTTON_VARIANT = {
  primary: "default",
  danger: "destructive",
  secondary: "secondary",
} as const;

/**
 * Next.js/shadcn port of frontend/src/components/v1/ConfirmationDialog.tsx.
 * The original hand-rolled focus trap, Escape-to-cancel, Enter-to-confirm,
 * and backdrop-click handling (see useFocusTrap in modal-stack.tsx) — Radix's
 * Dialog primitive (via shadcn/21st.dev) does all of that natively, so this
 * port is thinner than the source, not just a reskin. isTransitioning (the
 * original's manual pre-close-animation render flag) is dropped for the same
 * reason: Radix's data-state=closed exit animation replaces it.
 */
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
  const confirmButtonLabel = isConfirming && confirmingLabel ? confirmingLabel : confirmLabel;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent
        className={className}
        data-testid={testId}
        role="alertdialog"
        showCloseButton={false}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const isInputFocused =
              document.activeElement?.tagName === "INPUT" ||
              document.activeElement?.tagName === "TEXTAREA";
            if (!isConfirming && !isInputFocused) {
              e.preventDefault();
              onConfirm();
            }
          }
        }}
      >
        <DialogHeader>
          <DialogTitle data-testid={`${testId}-title`}>{title}</DialogTitle>
          {description && (
            <DialogDescription data-testid={`${testId}-description`}>
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isConfirming}
            data-testid={`${testId}-cancel-button`}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={CONFIRM_BUTTON_VARIANT[confirmVariant]}
            onClick={onConfirm}
            disabled={isConfirming}
            aria-busy={isConfirming}
            data-testid={`${testId}-confirm-button`}
          >
            {isConfirming && <Loader2 className="animate-spin" />}
            {confirmButtonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

ConfirmationDialog.displayName = "ConfirmationDialog";
export default ConfirmationDialog;
