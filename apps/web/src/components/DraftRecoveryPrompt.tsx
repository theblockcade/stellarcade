"use client";

import React, { useCallback, useMemo } from "react";
import "./DraftRecoveryPrompt.css";

export interface DraftRecoveryPromptProps {
  formId: string;
  formName: string;
  onRecover: () => void;
  onDiscard: () => void;
  draftSavedAt?: number;
  className?: string;
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
