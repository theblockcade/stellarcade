import type { ReactNode } from "react";

export interface EmptySearchResultsProps {
  /** The search term that returned no results. Used in the default message when `message` is omitted. */
  query?: string;
  /** Override the primary message text. */
  message?: string;
  /** Optional secondary hint (e.g. "Try broader keywords"). */
  hint?: string;
  /** Optional call-to-action rendered below the hint. */
  action?: ReactNode;
  /** Additional class names for the container. */
  className?: string;
}

/**
 * Reusable empty-state container for search results.
 *
 * Accessibility: rendered as a live region so screen readers announce the
 * empty state without requiring focus. The role="status" maps to
 * aria-live="polite" so it does not interrupt ongoing speech.
 */
export function EmptySearchResults({
  query,
  message,
  hint,
  action,
  className = "",
}: EmptySearchResultsProps) {
  const primaryText =
    message ??
    (query ? `No results for "${query}"` : "No results found");

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-testid="empty-search-results"
      style={styles.root}
      className={className}
    >
      <svg
        aria-hidden="true"
        focusable="false"
        width="40"
        height="40"
        viewBox="0 0 40 40"
        style={styles.icon}
      >
        <circle cx="18" cy="18" r="11" stroke="currentColor" strokeWidth="2" fill="none" />
        <line x1="26.5" y1="26.5" x2="34" y2="34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="14" y1="18" x2="22" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>

      <p style={styles.primary}>{primaryText}</p>

      {hint && <p style={styles.hint}>{hint}</p>}

      {action && <div style={styles.action}>{action}</div>}
    </div>
  );
}

const styles = {
  root: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "2.5rem 1rem",
    textAlign: "center" as const,
    color: "#64748b",
  },
  icon: {
    color: "#94a3b8",
    marginBottom: "0.25rem",
  },
  primary: {
    margin: 0,
    fontSize: "0.9375rem",
    fontWeight: 500,
    color: "#334155",
  },
  hint: {
    margin: 0,
    fontSize: "0.8125rem",
    color: "#64748b",
  },
  action: {
    marginTop: "0.5rem",
  },
} as const;
