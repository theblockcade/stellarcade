"use client";

import React from "react";

export type QueueStatus = "live" | "idle" | "paused" | "offline";

export interface QueuePulseIndicatorProps {
  count?: number;
  status?: QueueStatus;
  label?: string;
  loading?: boolean;
  className?: string;
  testId?: string;
}

const STATUS_META: Record<QueueStatus, { color: string; text: string }> = {
  live: { color: "#22c55e", text: "Live" },
  idle: { color: "#94a3b8", text: "Idle" },
  paused: { color: "#f59e0b", text: "Paused" },
  offline: { color: "#ef4444", text: "Offline" },
};

export function QueuePulseIndicator({
  count,
  status,
  label = "Queue",
  loading = false,
  className = "",
  testId = "queue-pulse-indicator",
}: QueuePulseIndicatorProps) {
  const resolvedCount = count ?? 0;
  const resolvedStatus: QueueStatus =
    status ?? (resolvedCount > 0 ? "live" : "idle");
  const meta = STATUS_META[resolvedStatus];

  if (loading) {
    return (
      <div
        className={`queue-pulse-indicator ${className}`}
        role="status"
        aria-busy="true"
        aria-label={`${label} loading`}
        data-testid={`${testId}-loading`}
        style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
      >
        <span style={{ width: "0.625rem", height: "0.625rem", borderRadius: "50%", background: "#475569" }} />
        <span style={{ width: "3rem", height: "0.625rem", borderRadius: "4px", background: "#334155" }} />
      </div>
    );
  }

  return (
    <div
      className={`queue-pulse-indicator ${className}`}
      role="status"
      aria-live="polite"
      aria-label={`${label}: ${meta.text}, ${resolvedCount} in queue`}
      data-testid={testId}
      style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem" }}
    >
      <span
        style={{
          width: "0.625rem",
          height: "0.625rem",
          borderRadius: "50%",
          backgroundColor: meta.color,
          boxShadow: resolvedStatus === "live" && resolvedCount > 0 ? `0 0 8px ${meta.color}` : "none",
        }}
      />
      <span style={{ color: "var(--sc-text-dim, #94a3b8)" }}>{label}</span>
      <span style={{ fontWeight: 700, color: "var(--sc-text-main, #ffffff)" }} data-testid="queue-count">
        {resolvedCount}
      </span>
      <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: meta.color, textTransform: "uppercase" }}>
        {meta.text}
      </span>
    </div>
  );
}

export default QueuePulseIndicator;
