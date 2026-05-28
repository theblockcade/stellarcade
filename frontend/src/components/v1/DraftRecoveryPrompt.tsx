/**
 * DraftRecoveryPrompt — Unsaved form draft recovery UI.
 *
 * Displays a dismissible prompt when a saved draft is detected for a form.
 * Allows users to recover their previous work or discard the draft.
 */

import React, { useCallback, useMemo } from "react";
import "./DraftRecoveryPrompt.css";

export interface DraftRecoveryPromptProps {
  /** Form identifier for draft lookup */
  formId: string;
  /** Form display name for the prompt message */
  formName: string;
  /** Callback when user chooses to recover the draft */
  onRecover: () => void;
  /** Callback when user chooses to discard the draft */
  onDiscard: () => void;
  /** Optional: timestamp of when draft was saved (for display) */
  draftSavedAt?: number;
  /** Optional CSS class for styling */
  className?: string;
  /** Optional test ID for testing */
  testId?: string;
}

export const DraftRecoveryPrompt: React.FC<DraftRecoveryPromptProps> = ({
  formName,
  onRecover,
  onDiscard,
  draftSavedAt,
  className = "",
  testId = "draft-recovery-prompt",
}) => {
  const baseClass = "draft-recovery-prompt";

  const timeAgoText = useMemo(() => {
    if (!draftSavedAt) return "";

    const now = Date.now();
    const diffMs = now - draftSavedAt;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  }, [draftSavedAt]);

  const handleRecover = useCallback(() => {
    onRecover();
  }, [onRecover]);

  const handleDiscard = useCallback(() => {
    onDiscard();
  }, [onDiscard]);

  return (
    <div
      className={`${baseClass} ${className}`.trim()}
      data-testid={testId}
      role="region"
      aria-label="Draft recovery"
    >
      <div className={`${baseClass}__content`}>
        <div className={`${baseClass}__icon`}>💾</div>
        <div className={`${baseClass}__message`}>
          <p className={`${baseClass}__title`}>
            Unsaved draft found for <strong>{formName}</strong>
          </p>
          {timeAgoText && (
            <p className={`${baseClass}__timestamp`}>Saved {timeAgoText}</p>
          )}
        </div>
      </div>
      <div className={`${baseClass}__actions`}>
        <button
          type="button"
          onClick={handleRecover}
          className={`${baseClass}__btn ${baseClass}__btn--primary`}
          data-testid={`${testId}-recover-btn`}
          aria-label={`Recover draft for ${formName}`}
        >
          Recover
        </button>
        <button
          type="button"
          onClick={handleDiscard}
          className={`${baseClass}__btn ${baseClass}__btn--secondary`}
          data-testid={`${testId}-discard-btn`}
          aria-label={`Discard draft for ${formName}`}
        >
          Discard
        </button>
      </div>
    </div>
  );
};

export default DraftRecoveryPrompt;
