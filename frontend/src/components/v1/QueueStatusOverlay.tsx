import React, { useEffect, useRef } from 'react';
import './QueueStatusOverlay.css';

export interface QueueStatusOverlayProps {
  isOpen: boolean;
  queueName: string;
  durationSeconds: number;
  estimatedWaitSeconds?: number;
  playersInQueue?: number;
  playersNeeded?: number;
  statusText?: string;
  onCancel: () => void;
  className?: string;
  testId?: string;
}

export const QueueStatusOverlay: React.FC<QueueStatusOverlayProps> = ({
  isOpen,
  queueName,
  durationSeconds,
  estimatedWaitSeconds,
  playersInQueue,
  playersNeeded,
  statusText = 'Finding match...',
  onCancel,
  className = '',
  testId = 'queue-status-overlay',
}) => {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Keyboard navigation: Escape key cancels matchmaking
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    // Auto-focus the cancel button when opened for accessibility
    cancelButtonRef.current?.focus();

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const hasPlayersInfo = typeof playersInQueue === 'number' && typeof playersNeeded === 'number' && playersNeeded > 0;
  const progressPercentage = hasPlayersInfo ? Math.min(100, (playersInQueue / playersNeeded) * 100) : 0;

  return (
    <div
      className={`queue-status-overlay-backdrop ${className}`}
      data-testid={testId}
      role="dialog"
      aria-modal="true"
      aria-labelledby="queue-overlay-title"
    >
      <div className="queue-status-overlay-card">
        {/* Animated radar/ping pulse */}
        <div className="queue-status-overlay__animation" aria-hidden="true">
          <div className="queue-status-overlay__ping" />
          <div className="queue-status-overlay__ping-inner" />
          <div className="queue-status-overlay__spinner" />
        </div>

        <h2 id="queue-overlay-title" className="queue-status-overlay__title">
          {queueName}
        </h2>

        <p className="queue-status-overlay__status" role="status" aria-live="polite">
          {statusText}
        </p>

        <div className="queue-status-overlay__timer" aria-label={`Time in queue: ${durationSeconds} seconds`}>
          {formatTime(durationSeconds)}
        </div>

        {estimatedWaitSeconds !== undefined && (
          <div className="queue-status-overlay__est-wait">
            Est. Wait Time: <span className="queue-status-overlay__time-value">{formatTime(estimatedWaitSeconds)}</span>
          </div>
        )}

        {hasPlayersInfo && (
          <div className="queue-status-overlay__progress-container">
            <div className="queue-status-overlay__progress-labels">
              <span>Players Found</span>
              <span className="queue-status-overlay__progress-count">
                {playersInQueue} / {playersNeeded}
              </span>
            </div>
            <div className="queue-status-overlay__progress-bar-bg">
              <div
                className="queue-status-overlay__progress-bar-fill"
                style={{ width: `${progressPercentage}%` }}
                role="progressbar"
                aria-valuenow={playersInQueue}
                aria-valuemin={0}
                aria-valuemax={playersNeeded}
                aria-label="Players joined in queue"
              />
            </div>
          </div>
        )}

        <button
          ref={cancelButtonRef}
          type="button"
          className="queue-status-overlay__cancel-btn"
          onClick={onCancel}
          aria-label="Cancel matchmaking"
        >
          Cancel Search
        </button>
      </div>
    </div>
  );
};

QueueStatusOverlay.displayName = 'QueueStatusOverlay';
export default QueueStatusOverlay;
