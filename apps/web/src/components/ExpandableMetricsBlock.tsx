"use client";

import React, {
  useState,
  useId,
  useCallback,
  type ReactNode,
  type KeyboardEvent,
} from "react";

export interface Metric {
  id: string;
  label: string;
  value: ReactNode;
  hint?: string;
}

export interface ExpandableMetricsBlockProps {
  title: string;
  primaryMetrics: Metric[];
  expandedMetrics?: Metric[];
  defaultExpanded?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  disabled?: boolean;
  onToggle?: (expanded: boolean) => void;
  className?: string;
}

export function ExpandableMetricsBlock({
  title,
  primaryMetrics,
  expandedMetrics = [],
  defaultExpanded = false,
  loading = false,
  emptyMessage = "No metrics available",
  disabled = false,
  onToggle,
  className = "",
}: ExpandableMetricsBlockProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const panelId = useId();

  const hasExpandable = expandedMetrics.length > 0;
  const isEmpty =
    !loading && primaryMetrics.length === 0 && expandedMetrics.length === 0;

  const toggle = useCallback(() => {
    if (disabled) return;
    setIsExpanded((prev) => {
      const next = !prev;
      onToggle?.(next);
      return next;
    });
  }, [disabled, onToggle]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    },
    [toggle],
  );

  return (
    <section
      className={`expandable-metrics-block ${className}`}
      style={styles.root}
      aria-label={title}
    >
      <header style={styles.header}>
        <span style={styles.title}>{title}</span>
      </header>

      {isEmpty ? (
        <p role="note" style={styles.empty}>
          {emptyMessage}
        </p>
      ) : (
        <>
          <MetricGrid metrics={primaryMetrics} loading={loading} />

          {hasExpandable && (
            <>
              <button
                type="button"
                aria-expanded={isExpanded}
                aria-controls={panelId}
                disabled={disabled}
                onClick={toggle}
                onKeyDown={handleKeyDown}
                style={{
                  ...styles.toggle,
                  ...(disabled ? styles.toggleDisabled : {}),
                }}
              >
                <span>
                  {isExpanded
                    ? "Show less"
                    : `Show ${expandedMetrics.length} more`}
                </span>
                <svg
                  aria-hidden="true"
                  focusable="false"
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  style={{
                    ...styles.chevron,
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                >
                  <path
                    d="M4 6l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </button>

              <div
                id={panelId}
                role="region"
                aria-label={`${title} — additional metrics`}
                hidden={!isExpanded}
              >
                {isExpanded && (
                  <MetricGrid metrics={expandedMetrics} loading={loading} />
                )}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}

function MetricGrid({
  metrics,
  loading,
}: {
  metrics: Metric[];
  loading: boolean;
}) {
  if (loading) {
    const count = Math.max(metrics.length, 1);
    return (
      <div
        style={styles.grid}
        role="status"
        aria-busy="true"
        aria-label="Loading metrics"
      >
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={styles.metric} data-testid="metric-skeleton">
            <span style={styles.skeletonLabel} aria-hidden="true" />
            <span style={styles.skeletonValue} aria-hidden="true" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={styles.grid}>
      {metrics.map((metric) => (
        <div key={metric.id} style={styles.metric}>
          <span style={styles.label}>{metric.label}</span>
          <span style={styles.value}>{metric.value}</span>
          {metric.hint && <span style={styles.hint}>{metric.hint}</span>}
        </div>
      ))}
    </div>
  );
}

const styles = {
  root: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
    borderRadius: "0.5rem",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    backgroundColor: "var(--sc-bg-card, #11161e)",
    padding: "0.75rem 1rem",
  },
  header: {
    display: "flex",
    alignItems: "center",
  },
  title: {
    fontSize: "0.8125rem",
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(8rem, 1fr))",
    gap: "0.75rem",
  },
  metric: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.125rem",
    minWidth: 0,
  },
  label: {
    fontSize: "0.75rem",
    color: "#94a3b8",
  },
  value: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#ffffff",
  },
  hint: {
    fontSize: "0.6875rem",
    color: "#64748b",
  },
  toggle: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.375rem",
    alignSelf: "flex-start",
    padding: "0.25rem 0",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "0.8125rem",
    fontWeight: 500,
    color: "var(--sc-accent, #00f0ff)",
    outline: "none",
  },
  toggleDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
    color: "#94a3b8",
  },
  chevron: {
    flexShrink: 0,
    transition: "transform 0.2s ease",
  },
  empty: {
    margin: 0,
    fontSize: "0.8125rem",
    color: "#94a3b8",
  },
  skeletonLabel: {
    display: "block",
    width: "60%",
    height: "0.6rem",
    borderRadius: "0.25rem",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  skeletonValue: {
    display: "block",
    width: "40%",
    height: "0.9rem",
    borderRadius: "0.25rem",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
} as const;

export default ExpandableMetricsBlock;
