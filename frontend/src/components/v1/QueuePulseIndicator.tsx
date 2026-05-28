export type QueueStatus = "live" | "idle" | "paused" | "offline";

export interface QueuePulseIndicatorProps {
  /** Number of players currently queued. */
  count?: number;
  /** Explicit status; defaults to "live" when count > 0, otherwise "idle". */
  status?: QueueStatus;
  /** Visible label (e.g. the surface name). */
  label?: string;
  loading?: boolean;
  className?: string;
}

const STATUS_META: Record<QueueStatus, { color: string; text: string }> = {
  live: { color: "#22c55e", text: "Live" },
  idle: { color: "#94a3b8", text: "Idle" },
  paused: { color: "#f59e0b", text: "Paused" },
  offline: { color: "#ef4444", text: "Offline" },
};

const KEYFRAMES = `
@keyframes sc-queue-pulse {
  0% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(2.2); opacity: 0; }
  100% { transform: scale(1); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .sc-queue-pulse-ring { animation: none !important; }
}
`;

/**
 * A live queue-pulse indicator for multiplayer entry surfaces. Shows a status
 * dot (pulsing while the queue is live and non-empty), the queued count, and a
 * label. Announces queue changes via an `aria-live` status region; honors
 * reduced-motion and renders explicit loading / empty / offline states.
 */
export function QueuePulseIndicator({
  count,
  status,
  label = "Queue",
  loading = false,
  className = "",
}: QueuePulseIndicatorProps) {
  const resolvedCount = count ?? 0;
  const resolvedStatus: QueueStatus =
    status ?? (resolvedCount > 0 ? "live" : "idle");
  const meta = STATUS_META[resolvedStatus];
  const isPulsing = resolvedStatus === "live" && resolvedCount > 0;

  if (loading) {
    return (
      <div
        className={`queue-pulse-indicator ${className}`}
        role="status"
        aria-busy="true"
        aria-label={`${label} loading`}
        style={styles.root}
      >
        <span style={styles.skeletonDot} aria-hidden="true" />
        <span style={styles.skeletonText} aria-hidden="true" />
      </div>
    );
  }

  return (
    <div
      className={`queue-pulse-indicator ${className}`}
      role="status"
      aria-live="polite"
      aria-label={`${label}: ${meta.text}, ${resolvedCount} in queue`}
      style={styles.root}
    >
      <style>{KEYFRAMES}</style>
      <span style={styles.dotWrap} aria-hidden="true">
        {isPulsing && (
          <span
            className="sc-queue-pulse-ring"
            style={{
              ...styles.ring,
              backgroundColor: meta.color,
              animation: "sc-queue-pulse 1.6s ease-out infinite",
            }}
          />
        )}
        <span style={{ ...styles.dot, backgroundColor: meta.color }} />
      </span>
      <span style={styles.label}>{label}</span>
      <span style={styles.count} data-testid="queue-count">
        {resolvedCount}
      </span>
      <span style={{ ...styles.statusText, color: meta.color }}>
        {meta.text}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles (inline — avoids CSS class collisions in mixed codebases)
// ---------------------------------------------------------------------------
const styles = {
  root: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.8125rem",
  },
  dotWrap: {
    position: "relative" as const,
    display: "inline-flex",
    width: "0.625rem",
    height: "0.625rem",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "relative" as const,
    width: "0.625rem",
    height: "0.625rem",
    borderRadius: "9999px",
  },
  ring: {
    position: "absolute" as const,
    inset: 0,
    borderRadius: "9999px",
  },
  label: {
    color: "#64748b",
  },
  count: {
    fontWeight: 700,
    color: "#0f172a",
    fontVariantNumeric: "tabular-nums" as const,
  },
  statusText: {
    fontSize: "0.6875rem",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  },
  skeletonDot: {
    width: "0.625rem",
    height: "0.625rem",
    borderRadius: "9999px",
    backgroundColor: "#cbd5e1",
  },
  skeletonText: {
    width: "4rem",
    height: "0.6rem",
    borderRadius: "0.25rem",
    backgroundColor: "#e2e8f0",
  },
} as const;
