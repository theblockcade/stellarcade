"use client";

import React from "react";

export interface SessionCountdownWidgetProps {
  remainingMs: number | null;
  warnBeforeExpiryMs?: number;
  className?: string;
  testId?: string;
}

function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  }

  return `${seconds}s`;
}

export function SessionCountdownWidget({
  remainingMs,
  warnBeforeExpiryMs = 120_000,
  className = "",
  testId = "session-countdown-widget",
}: SessionCountdownWidgetProps): React.JSX.Element | null {
  if (remainingMs === null) {
    return null;
  }

  const safeRemainingMs = Math.max(0, remainingMs);
  const tone =
    safeRemainingMs <= 0
      ? "expired"
      : safeRemainingMs <= warnBeforeExpiryMs
        ? "warning"
        : "neutral";
  const label = safeRemainingMs <= 0 ? "Expired" : formatCountdown(safeRemainingMs);

  return (
    <strong
      className={`session-countdown-widget session-countdown-widget--${tone} ${className}`.trim()}
      data-testid={testId}
      aria-live="polite"
      aria-label={`Session expires in ${label}`}
      title={`Session expires in ${label}`}
      role="status"
      style={{
        color: tone === "warning" ? "var(--sc-warning, #facc15)" : tone === "expired" ? "var(--sc-error, #ef4444)" : "inherit",
      }}
    >
      {label}
    </strong>
  );
}

export default SessionCountdownWidget;
