import React from "react";
import "./PendingActionResumeChip.css";

export interface PendingActionResumeChipProps {
  label: string;
  detail?: string;
  onResume: () => void;
  onDismiss?: () => void;
  disabled?: boolean;
  className?: string;
  testId?: string;
}

export function PendingActionResumeChip({
  label,
  detail,
  onResume,
  onDismiss,
  disabled = false,
  className,
  testId = "pending-action-resume-chip",
}: PendingActionResumeChipProps): React.JSX.Element {
  return (
    <div
      className={["pending-action-chip", className].filter(Boolean).join(" ")}
      role="status"
      aria-live="polite"
      data-testid={testId}
    >
      <div className="pending-action-chip__copy">
        <span className="pending-action-chip__eyebrow">Pending action</span>
        <strong className="pending-action-chip__label">{label}</strong>
        {detail ? <span className="pending-action-chip__detail">{detail}</span> : null}
      </div>

      <div className="pending-action-chip__actions">
        <button
          type="button"
          className="pending-action-chip__button pending-action-chip__button--primary"
          onClick={onResume}
          disabled={disabled}
          data-testid={`${testId}-resume-btn`}
        >
          {disabled ? "Resuming..." : "Resume"}
        </button>

        {onDismiss ? (
          <button
            type="button"
            className="pending-action-chip__button pending-action-chip__button--dismiss"
            onClick={onDismiss}
            data-testid={`${testId}-dismiss-btn`}
            aria-label="Dismiss pending action"
          >
            Dismiss
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default PendingActionResumeChip;
