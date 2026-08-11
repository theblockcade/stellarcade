"use client";

import React, { useMemo } from "react";
import "./QueueReadinessChip.css";

export type QueueReadinessState =
  | "idle"
  | "forming"
  | "ready"
  | "disabled"
  | "unavailable";

export interface QueueReadinessChipProps {
  state: QueueReadinessState;
  label?: string;
  queuedCount?: number;
  iconOnly?: boolean;
  className?: string;
  testId?: string;
}

const STATE_CONFIG: Record<
  QueueReadinessState,
  { label: string; tone: string; icon: string; ariaText: string }
> = {
  idle: {
    label: "Queue open",
    tone: "queue-readiness-chip--idle",
    icon: "○",
    ariaText: "Queue open, no players waiting yet",
  },
  forming: {
    label: "Filling",
    tone: "queue-readiness-chip--forming",
    icon: "◌",
    ariaText: "Players joining, match forming",
  },
  ready: {
    label: "Match ready",
    tone: "queue-readiness-chip--ready",
    icon: "●",
    ariaText: "Match ready, dropping in",
  },
  disabled: {
    label: "Queue paused",
    tone: "queue-readiness-chip--disabled",
    icon: "—",
    ariaText: "Queue paused",
  },
  unavailable: {
    label: "Unavailable",
    tone: "queue-readiness-chip--unavailable",
    icon: "?",
    ariaText: "Queue status unavailable",
  },
};

export const QueueReadinessChip: React.FC<QueueReadinessChipProps> = ({
  state,
  label,
  queuedCount,
  iconOnly = false,
  className,
  testId = "queue-readiness-chip",
}) => {
  const config = STATE_CONFIG[state];
  const visibleLabel = label ?? config.label;
  const showCount =
    typeof queuedCount === "number" &&
    queuedCount > 0 &&
    (state === "forming" || state === "idle");

  const ariaLabel = useMemo(() => {
    const base = label ? `${label}.` : `${config.ariaText}.`;
    return showCount ? `${base} ${queuedCount} waiting.` : base;
  }, [config.ariaText, label, queuedCount, showCount]);

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      data-testid={testId}
      data-state={state}
      className={`queue-readiness-chip ${config.tone} ${className || ""}`.trim()}
    >
      <span className="queue-readiness-chip__icon" aria-hidden="true">
        {config.icon}
      </span>
      {!iconOnly && (
        <span className="queue-readiness-chip__label">{visibleLabel}</span>
      )}
      {showCount && (
        <span className="queue-readiness-chip__count" data-testid={`${testId}-count`}>
          {queuedCount}
        </span>
      )}
    </span>
  );
};

export default QueueReadinessChip;
