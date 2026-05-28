import React from 'react';
import './DraftPresenceIndicator.css';

export type DraftPresenceStatus = 'saving' | 'saved' | 'conflict' | 'stale' | 'idle';

export interface DraftPresenceIndicatorProps {
  draftId: string;
  moduleName: string;
  status: DraftPresenceStatus;
  lastEditedAt?: number;
  onDiscard?: () => void;
  onResume?: () => void;
  className?: string;
  testId?: string;
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

const STATUS_CONFIG: Record<DraftPresenceStatus, { label: string; icon: string } | null> = {
  saving: { label: 'Saving...', icon: '' },
  saved: { label: 'Draft saved', icon: '' },
  conflict: { label: 'Draft has conflicts', icon: '' },
  stale: { label: 'Draft saved', icon: '' },
  idle: null,
};

export const DraftPresenceIndicator: React.FC<DraftPresenceIndicatorProps> = ({
  draftId,
  moduleName,
  status,
  lastEditedAt,
  onDiscard,
  onResume,
  className = '',
  testId = 'draft-presence-indicator',
}) => {
  if (!draftId || status === 'idle') {
    return null;
  }

  const config = STATUS_CONFIG[status];
  if (!config) return null;

  const classes = [
    'draft-presence',
    `draft-presence--${status}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      data-testid={testId}
      data-status={status}
      role="status"
      aria-live={status === 'saving' ? 'polite' : undefined}
      aria-label={`${moduleName}: ${config.label}`}
    >
      <span className="draft-presence__icon" aria-hidden="true">
        {config.icon}
      </span>
      <span className="draft-presence__label">
        {config.label}
        {status === 'stale' && lastEditedAt && (
          <span className="draft-presence__time"> {formatRelativeTime(lastEditedAt)}</span>
        )}
      </span>
      {status === 'saving' && (
        <span className="draft-presence__spinner" aria-hidden="true" />
      )}
      {status === 'conflict' && onResume && (
        <button
          type="button"
          className="draft-presence__action"
          onClick={onResume}
          data-testid={`${testId}-resolve`}
        >
          Resolve
        </button>
      )}
      {(status === 'saved' || status === 'stale' || status === 'conflict') && onDiscard && (
        <button
          type="button"
          className="draft-presence__action draft-presence__action--discard"
          onClick={onDiscard}
          data-testid={`${testId}-discard`}
        >
          Discard
        </button>
      )}
    </div>
  );
};

DraftPresenceIndicator.displayName = 'DraftPresenceIndicator';

export default DraftPresenceIndicator;
