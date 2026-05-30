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
  className?: string;
}

export function PreferenceDraftIndicator({
  hasDraft,
  label = 'Draft',
  onResume,
  onDiscard,
  sectionId = 'preference',
  className = '',
}: PreferenceDraftIndicatorProps): React.JSX.Element | null {
  if (!hasDraft) return null;

  return (
    <div 
      className={`preference-draft-indicator ${className}`.trim()}
      data-testid={`${sectionId}-draft-indicator`}
      role="status"
      aria-label="Unsaved changes"
    >
      <div className="preference-draft-indicator__badge">
        <span className="preference-draft-indicator__dot" aria-hidden="true" />
        <span className="preference-draft-indicator__label">{label}</span>
      </div>

      {(onResume || onDiscard) && (
        <div className="preference-draft-indicator__actions">
          {onResume && (
            <button
              type="button"
              className="preference-draft-indicator__btn"
              onClick={onResume}
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
