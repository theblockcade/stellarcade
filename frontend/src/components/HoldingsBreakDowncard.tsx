import { useMemo } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface Holding {
  /** Unique identifier (e.g. contract address or asset symbol) */
  id: string;
  label: string;
  /** Raw balance in the asset's smallest unit or a pre-formatted number */
  amount: number;
  /** Optional fiat equivalent */
  valueUsd?: number;
  /** Optional colour override for the bar segment */
  color?: string;
}

export interface HoldingsBreakdownCardProps {
  holdings: Holding[];
  /** Currency symbol shown next to fiat totals */
  currencySymbol?: string;
  /** Show fiat value column. Defaults to true when any holding has valueUsd */
  showFiatValues?: boolean;
  /** Card heading */
  title?: string;
  /** Loading skeleton */
  isLoading?: boolean;
  /** Error state */
  error?: string | null;
  className?: string;
}

// ---------------------------------------------------------------------------
// Default palette — cycles when more holdings than colours
// ---------------------------------------------------------------------------
const DEFAULT_COLORS = [
  "#6366f1",
  "#22d3ee",
  "#f59e0b",
  "#10b981",
  "#f43f5e",
  "#a78bfa",
  "#34d399",
  "#fb923c",
];

function formatAmount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function formatUsd(n: number, symbol: string): string {
  return `${symbol}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function SkeletonRow() {
  return (
    <div style={styles.skeletonRow} aria-hidden="true">
      <div
        style={{
          ...styles.skeletonPulse,
          width: "1rem",
          height: "1rem",
          borderRadius: "50%",
        }}
      />
      <div style={{ ...styles.skeletonPulse, flex: 1, height: "0.75rem" }} />
      <div
        style={{ ...styles.skeletonPulse, width: "4rem", height: "0.75rem" }}
      />
    </div>
  );
}

function StackedBar({
  segments,
}: {
  segments: { color: string; pct: number }[];
}) {
  return (
    <div
      role="img"
      aria-label="Holdings distribution bar"
      style={styles.stackedBar}
    >
      {segments.map((s, i) => (
        <div
          key={i}
          style={{
            ...styles.barSegment,
            width: `${s.pct}%`,
            backgroundColor: s.color,
            borderRadius:
              i === 0
                ? "9999px 0 0 9999px"
                : i === segments.length - 1
                  ? "0 9999px 9999px 0"
                  : "0",
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function HoldingsBreakdownCard({
  holdings,
  currencySymbol = "$",
  showFiatValues,
  title = "Holdings",
  isLoading = false,
  error = null,
  className = "",
}: HoldingsBreakdownCardProps) {
  const hasFiat = showFiatValues ?? holdings.some((h) => h.valueUsd != null);

  const totalUsd = useMemo(
    () => holdings.reduce((acc, h) => acc + (h.valueUsd ?? 0), 0),
    [holdings],
  );

  const totalAmount = useMemo(
    () => holdings.reduce((acc, h) => acc + h.amount, 0),
    [holdings],
  );

  // Assign colours and compute percentages
  const enriched = useMemo(
    () =>
      holdings.map((h, i) => ({
        ...h,
        resolvedColor: h.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
        pct: totalAmount > 0 ? (h.amount / totalAmount) * 100 : 0,
      })),
    [holdings, totalAmount],
  );

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------
  const renderBody = () => {
    if (isLoading) {
      return (
        <div aria-busy="true" aria-label="Loading holdings">
          {[...Array(3)].map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div role="alert" style={styles.errorState}>
          <span style={styles.errorIcon} aria-hidden="true">
            ⚠
          </span>
          <p style={styles.errorText}>{error}</p>
        </div>
      );
    }

    if (holdings.length === 0) {
      return (
        <div style={styles.emptyState} role="status">
          <p style={styles.emptyText}>No holdings to display</p>
        </div>
      );
    }

    return (
      <>
        {/* Distribution bar */}
        <StackedBar
          segments={enriched.map((h) => ({
            color: h.resolvedColor,
            pct: h.pct,
          }))}
        />

        {/* Rows */}
        <table style={styles.table} aria-label={`${title} breakdown`}>
          <thead>
            <tr>
              <th style={{ ...styles.th, textAlign: "left" }}>Asset</th>
              <th style={{ ...styles.th, textAlign: "right" }}>Amount</th>
              {hasFiat && (
                <th style={{ ...styles.th, textAlign: "right" }}>Value</th>
              )}
              <th style={{ ...styles.th, textAlign: "right" }}>Share</th>
            </tr>
          </thead>
          <tbody>
            {enriched.map((h) => (
              <tr key={h.id} style={styles.row}>
                <td style={styles.td}>
                  <span style={styles.dotWrapper}>
                    <span
                      style={{
                        ...styles.dot,
                        backgroundColor: h.resolvedColor,
                      }}
                      aria-hidden="true"
                    />
                    <span style={styles.assetLabel}>{h.label}</span>
                  </span>
                </td>
                <td style={{ ...styles.td, textAlign: "right" }}>
                  {formatAmount(h.amount)}
                </td>
                {hasFiat && (
                  <td
                    style={{
                      ...styles.td,
                      textAlign: "right",
                      color: "#64748b",
                    }}
                  >
                    {h.valueUsd != null
                      ? formatUsd(h.valueUsd, currencySymbol)
                      : "—"}
                  </td>
                )}
                <td style={{ ...styles.td, textAlign: "right" }}>
                  <span style={styles.pctBadge}>{h.pct.toFixed(1)}%</span>
                </td>
              </tr>
            ))}
          </tbody>
          {hasFiat && holdings.length > 1 && (
            <tfoot>
              <tr>
                <td colSpan={2} style={{ ...styles.td, ...styles.footLabel }}>
                  Total
                </td>
                <td
                  style={{ ...styles.td, textAlign: "right", fontWeight: 600 }}
                >
                  {formatUsd(totalUsd, currencySymbol)}
                </td>
                <td style={styles.td} />
              </tr>
            </tfoot>
          )}
        </table>
      </>
    );
  };

  return (
    <section
      className={`holdings-breakdown-card ${className}`}
      aria-label={title}
      style={styles.card}
    >
      <header style={styles.header}>
        <h2 style={styles.cardTitle}>{title}</h2>
        {!isLoading && !error && hasFiat && holdings.length > 1 && (
          <span
            style={styles.totalBadge}
            aria-label={`Total value ${formatUsd(totalUsd, currencySymbol)}`}
          >
            {formatUsd(totalUsd, currencySymbol)}
          </span>
        )}
      </header>

      <div style={styles.body}>{renderBody()}</div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = {
  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "0.75rem",
    overflow: "hidden",
    fontSize: "0.875rem",
    color: "#1e293b",
    maxWidth: "480px",
    width: "100%",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.875rem 1rem 0.5rem",
    borderBottom: "1px solid #f1f5f9",
  },
  cardTitle: {
    margin: 0,
    fontSize: "0.9375rem",
    fontWeight: 600,
    color: "#0f172a",
  },
  totalBadge: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#6366f1",
  },
  body: {
    padding: "0.75rem 1rem 1rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.75rem",
  },
  stackedBar: {
    display: "flex",
    height: "6px",
    borderRadius: "9999px",
    overflow: "hidden",
    backgroundColor: "#f1f5f9",
    gap: "2px",
  },
  barSegment: {
    height: "100%",
    transition: "width 0.3s ease",
    minWidth: "2px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
  },
  th: {
    padding: "0.25rem 0.375rem",
    fontSize: "0.6875rem",
    fontWeight: 600,
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
    color: "#94a3b8",
  },
  row: {
    borderTop: "1px solid #f8fafc",
  },
  td: {
    padding: "0.4375rem 0.375rem",
    verticalAlign: "middle" as const,
    fontSize: "0.875rem",
  },
  dotWrapper: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  assetLabel: {
    fontWeight: 500,
  },
  pctBadge: {
    display: "inline-block",
    padding: "0.0625rem 0.375rem",
    borderRadius: "9999px",
    backgroundColor: "#f1f5f9",
    color: "#64748b",
    fontSize: "0.75rem",
    fontWeight: 500,
  },
  footLabel: {
    fontWeight: 600,
    color: "#64748b",
    textAlign: "right" as const,
    paddingRight: "0.5rem",
  },
  emptyState: {
    textAlign: "center" as const,
    padding: "1.5rem 0",
  },
  emptyText: {
    margin: 0,
    color: "#94a3b8",
    fontSize: "0.875rem",
  },
  errorState: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem",
    borderRadius: "0.375rem",
    backgroundColor: "#fef2f2",
    border: "1px solid #fee2e2",
  },
  errorIcon: {
    fontSize: "1rem",
    color: "#ef4444",
  },
  errorText: {
    margin: 0,
    color: "#dc2626",
    fontSize: "0.875rem",
  },
  skeletonRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.5rem 0",
  },
  skeletonPulse: {
    backgroundColor: "#e2e8f0",
    borderRadius: "0.25rem",
    animation: "pulse 1.5s ease-in-out infinite",
  },
} as const;
