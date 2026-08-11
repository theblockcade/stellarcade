"use client";

import React, { useEffect, useRef } from "react";
import "./QueueStatusOverlay.css";

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
  statusText = "Finding match...",
  onCancel,
  className = "",
  testId = "queue-status-overlay",
}) => {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    cancelButtonRef.current?.focus();
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`queue-status-overlay-backdrop ${className}`}
      data-testid={testId}
      role="dialog"
      aria-modal="true"
      aria-labelledby="queue-overlay-title"
    >
      <div className="queue-status-overlay-card">
        <h2 id="queue-overlay-title" className="queue-status-overlay__title">
          {queueName}
        </h2>

        <p className="queue-status-overlay__status" role="status" aria-live="polite">
          {statusText}
        </p>

        <div
          className="queue-status-overlay__timer"
          aria-label={`Time in queue: ${durationSeconds} seconds`}
        >
          {formatTime(durationSeconds)}
        </div>

        <button
          ref={cancelButtonRef}
          type="button"
          className="queue-status-overlay__cancel-btn"
          onClick={onCancel}
          aria-label="Cancel matchmaking"
          data-testid={`${testId}-cancel`}
        >
          Cancel Search
        </button>
      </div>
    </div>
  );
};

QueueStatusOverlay.displayName = "QueueStatusOverlay";
export default QueueStatusOverlay;
