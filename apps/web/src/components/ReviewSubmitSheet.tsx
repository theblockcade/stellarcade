"use client";

import React, { useCallback, useEffect, useRef } from 'react';
import './ReviewSubmitSheet.css';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ReviewField {
  label: string;
  value: React.ReactNode;
  sensitive?: boolean;
}

export interface ReviewSubmitSheetProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  fields?: ReviewField[];
  riskLevel?: RiskLevel;
  isSubmitting?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  className?: string;
  testId?: string;
}

const RISK_LABELS: Record<RiskLevel, string> = {
  low: 'Low risk',
  medium: 'Medium risk',
  high: 'High risk',
  critical: 'Critical — irreversible',
};

const FOCUSABLE_QUERY =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const ReviewSubmitSheet: React.FC<ReviewSubmitSheetProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  fields = [],
  riskLevel = 'medium',
  isSubmitting = false,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  className = '',
  testId = 'review-submit-sheet',
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previousFocusRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;

      requestAnimationFrame(() => {
        const cancelBtn = sheetRef.current?.querySelector<HTMLElement>(
          '[data-rss-cancel]',
        );
        cancelBtn?.focus();
      });
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusable = sheetRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_QUERY);
      if (!focusable || focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [open, onClose, isSubmitting]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget && !isSubmitting) onClose();
    },
    [isSubmitting, onClose],
  );

  if (!open) return null;

  return (
    <div
      className="rss__backdrop"
      data-testid={`${testId}-backdrop`}
      onClick={handleBackdropClick}
      aria-hidden="false"
    >
      <div
        ref={sheetRef}
        className={`rss ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${testId}-title`}
        aria-describedby={description ? `${testId}-description` : undefined}
        data-testid={testId}
      >
        <div className={`rss__risk rss__risk--${riskLevel}`} data-testid={`${testId}-risk`}>
          <span className="rss__risk-label">{RISK_LABELS[riskLevel]}</span>
        </div>

        <h2 id={`${testId}-title`} className="rss__title" data-testid={`${testId}-title`}>
          {title}
        </h2>

        {description && (
          <p
            id={`${testId}-description`}
            className="rss__description"
            data-testid={`${testId}-description`}
          >
            {description}
          </p>
        )}

        {fields.length > 0 && (
          <dl className="rss__fields" data-testid={`${testId}-fields`}>
            {fields.map((field, i) => (
              <div
                key={i}
                className={`rss__field${field.sensitive ? ' rss__field--sensitive' : ''}`}
                data-testid={`${testId}-field-${i}`}
              >
                <dt className="rss__field-label">{field.label}</dt>
                <dd className="rss__field-value">{field.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="rss__actions" data-testid={`${testId}-actions`}>
          <button
            type="button"
            className="rss__btn rss__btn--cancel"
            onClick={onClose}
            disabled={isSubmitting}
            data-rss-cancel
            data-testid={`${testId}-cancel`}
            aria-label={cancelLabel}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className={`rss__btn rss__btn--confirm rss__btn--risk-${riskLevel}`}
            onClick={onConfirm}
            disabled={isSubmitting}
            aria-disabled={isSubmitting}
            data-testid={`${testId}-confirm`}
            aria-label={isSubmitting ? 'Submitting…' : confirmLabel}
          >
            {isSubmitting ? 'Submitting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewSubmitSheet;
