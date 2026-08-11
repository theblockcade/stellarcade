"use client";

import React from "react";
import "./PreferenceDraftIndicator.css";

export interface PreferenceDraftIndicatorProps {
  hasDraft: boolean;
  label?: string;
  onResume?: () => void;
  onDiscard?: () => void;
  sectionId?: string;
  isSaving?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  lastModified?: number;
  className?: string;
}

export function PreferenceDraftIndicator({
  hasDraft,
  label = "Draft",
  onResume,
  onDiscard,
  sectionId = "preference",
  isSaving = false,
  disabled = false,
  disabledReason,
  lastModified,
  className = "",
}: PreferenceDraftIndicatorProps): React.JSX.Element | null {
  if (!hasDraft) return null;

  const isActionDisabled = disabled || isSaving;

  return (
    <div
      className={`preference-draft-indicator ${disabled ? "preference-draft-indicator--disabled" : ""} ${className}`.trim()}
      data-testid={`${sectionId}-draft-indicator`}
      role="status"
      aria-label="Unsaved changes"
      aria-busy={isSaving}
    >
      <div className="preference-draft-indicator__badge">
        <span className="preference-draft-indicator__label">
          {isSaving ? "Saving..." : label}
        </span>
      </div>

      {(onResume || onDiscard) && (
        <div className="preference-draft-indicator__actions">
          {onResume && (
            <button
              type="button"
              className="preference-draft-indicator__btn"
              onClick={onResume}
              disabled={isActionDisabled}
              data-testid={`${sectionId}-draft-resume`}
              aria-label="Resume draft"
            >
              Resume
            </button>
          )}
          {onDiscard && (
            <button
              type="button"
              className="preference-draft-indicator__btn preference-draft-indicator__btn--discard"
              onClick={onDiscard}
              disabled={isActionDisabled}
              data-testid={`${sectionId}-draft-discard`}
              aria-label="Discard draft"
            >
              Discard
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default PreferenceDraftIndicator;
