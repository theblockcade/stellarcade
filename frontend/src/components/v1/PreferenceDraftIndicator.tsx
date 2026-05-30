import React from 'react';
import './PreferenceDraftIndicator.css';

export interface PreferenceDraftIndicatorProps {
  /** Indicates whether the section has unpublished draft changes */
  hasDraft: boolean;
  /** Label for the indicator */
  label?: string;
  /** Action handler to resume/edit the draft */
  onResume?: () => void;
  /** Action handler to discard the draft */
  onDiscard?: () => void;
  /** The id of the preference section this belongs to, for testing */
  sectionId?: string;
  /** Whether the draft is currently being saved */
  isSaving?: boolean;
  /** Whether the draft actions are disabled */
  disabled?: boolean;
  /** Reason for disabled state */
  disabledReason?: string;
  /** Timestamp when draft was last modified */
  lastModified?: number;
  className?: string;
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function PreferenceDraftIndicator({
  hasDraft,
  label = 'Draft',
  onResume,
  onDiscard,
  sectionId = 'preference',
  isSaving = false,
  disabled = false,
  disabledReason,
  lastModified,
  className = '',
}: PreferenceDraftIndicatorProps): React.JSX.Element | null {
  if (!hasDraft) return null;

  const isActionDisabled = disabled || isSaving;

  return (
    <div 
      className={`preference-draft-indicator ${disabled ? 'preference-draft-indicator--disabled' : ''} ${className}`.trim()}
      data-testid={`${sectionId}-draft-indicator`}
      role="status"
      aria-label="Unsaved changes"
      aria-busy={isSaving}
    >
      <div className="preference-draft-indicator__badge">
        {isSaving ? (
          <span className="preference-draft-indicator__spinner" aria-hidden="true" />
        ) : (
          <span className="preference-draft-indicator__dot" aria-hidden="true" />
        )}
        <span className="preference-draft-indicator__label">
          {isSaving ? 'Saving...' : label}
        </span>
        {lastModified && !isSaving && (
          <span className="preference-draft-indicator__time">
            {formatRelativeTime(lastModified)}
          </span>
        )}
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
              aria-busy={isSaving}
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
              aria-describedby={disabled && disabledReason ? `${sectionId}-disabled-reason` : undefined}
            >
              Discard
            </button>
          )}
        </div>
      )}
      {disabled && disabledReason && (
        <span id={`${sectionId}-disabled-reason`} className="sr-only" role="status">
          {disabledReason}
        </span>
      )}
    </div>
  );
}

export default PreferenceDraftIndicator;
