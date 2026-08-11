"use client";

import React from "react";
import { StatusPill } from "./StatusPill";
import type { QueueMetrics } from "./QueueHealthWidget";
import "./QueueStateMiniPanel.css";

export type QueuePanelContext = "lobby" | "live-match";

export interface QueueStateMiniPanelProps {
  metrics?: QueueMetrics;
  title?: string;
  context?: QueuePanelContext;
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  className?: string;
  testId?: string;
}

const HEALTH_TONE: Record<QueueMetrics["queueHealth"], "success" | "warning" | "error" | "neutral"> = {
  healthy: "success",
  degraded: "warning",
  critical: "error",
  offline: "neutral",
};

const HEALTH_LABEL: Record<QueueMetrics["queueHealth"], string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  critical: "Critical",
  offline: "Offline",
};

function formatWait(seconds: number): string {
  if (seconds <= 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export const QueueStateMiniPanel: React.FC<QueueStateMiniPanelProps> = ({
  metrics,
  title,
  context = "lobby",
  loading = false,
  error,
  onRefresh,
  className = "",
  testId = "queue-state-mini-panel",
}) => {
  const resolvedTitle = title ?? (context === "live-match" ? "Match Queue" : "Queue Status");

  const current = metrics ?? {
    playersInQueue: 0,
    averageWaitTime: 0,
    estimatedWaitTime: 0,
    activeMatches: 0,
    queueHealth: "offline" as const,
    lastUpdated: new Date().toISOString(),
  };

  return (
    <div className={`queue-state-mini-panel ${className}`} data-testid={testId}>
      <header className="queue-state-mini-panel__header">
        <div className="queue-state-mini-panel__title-row">
          <h3 className="queue-state-mini-panel__title">{resolvedTitle}</h3>
          <StatusPill
            tone={HEALTH_TONE[current.queueHealth]}
            label={HEALTH_LABEL[current.queueHealth]}
            size="compact"
            testId={`${testId}-health`}
          />
        </div>
      </header>

      <div className="queue-state-mini-panel__metrics" data-testid={`${testId}-metrics`}>
        <div className="queue-state-mini-panel__metric">
          <span className="queue-state-mini-panel__metric-value">
            {loading ? "—" : current.playersInQueue}
          </span>
          <span className="queue-state-mini-panel__metric-label">Players</span>
        </div>
        <div className="queue-state-mini-panel__metric">
          <span className="queue-state-mini-panel__metric-value">
            {loading ? "—" : formatWait(current.estimatedWaitTime)}
          </span>
          <span className="queue-state-mini-panel__metric-label">Est. Wait</span>
        </div>
        <div className="queue-state-mini-panel__metric">
          <span className="queue-state-mini-panel__metric-value">
            {loading ? "—" : current.activeMatches}
          </span>
          <span className="queue-state-mini-panel__metric-label">Active</span>
        </div>
      </div>

      <footer className="queue-state-mini-panel__footer">
        <span>{context === "live-match" ? "Live match" : "Lobby queue"}</span>
        <span data-testid={`${testId}-updated`}>{current.lastUpdated ? "Updated recently" : "—"}</span>
      </footer>
    </div>
  );
};

QueueStateMiniPanel.displayName = "QueueStateMiniPanel";

export default QueueStateMiniPanel;
