"use client";

import React, { type ReactNode } from "react";

export interface MetadataItem {
  id: string;
  label: string;
  value: ReactNode;
  title?: string;
}

export interface CompactMetadataStackProps {
  items: MetadataItem[];
  loading?: boolean;
  emptyMessage?: string;
  dense?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function CompactMetadataStack({
  items,
  loading = false,
  emptyMessage = "No details available",
  dense = false,
  ariaLabel = "Details",
  className = "",
}: CompactMetadataStackProps) {
  const rowGap = dense ? "0.25rem" : "0.5rem";

  if (!loading && items.length === 0) {
    return (
      <p
        className={`compact-metadata-stack ${className}`}
        role="note"
        style={styles.empty}
      >
        {emptyMessage}
      </p>
    );
  }

  if (loading) {
    const count = Math.max(items.length, 3);
    return (
      <dl
        className={`compact-metadata-stack ${className}`}
        aria-label={ariaLabel}
        aria-busy="true"
        style={{ ...styles.list, rowGap }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={styles.row} data-testid="metadata-skeleton">
            <dt style={styles.label}>
              <span style={styles.skeletonLabel} aria-hidden="true" />
            </dt>
            <dd style={styles.value}>
              <span style={styles.skeletonValue} aria-hidden="true" />
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <dl
      className={`compact-metadata-stack ${className}`}
      aria-label={ariaLabel}
      style={{ ...styles.list, rowGap }}
    >
      {items.map((item) => (
        <div key={item.id} style={styles.row}>
          <dt style={styles.label}>{item.label}</dt>
          <dd style={styles.value} title={item.title}>
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

const styles = {
  list: {
    display: "flex",
    flexDirection: "column" as const,
    margin: 0,
  },
  row: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "1rem",
  },
  label: {
    flexShrink: 0,
    fontSize: "0.75rem",
    color: "#94a3b8",
    margin: 0,
  },
  value: {
    margin: 0,
    minWidth: 0,
    textAlign: "right" as const,
    fontSize: "0.8125rem",
    fontWeight: 600,
    color: "#ffffff",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  empty: {
    margin: 0,
    fontSize: "0.8125rem",
    color: "#94a3b8",
  },
  skeletonLabel: {
    display: "block",
    width: "4rem",
    height: "0.6rem",
    borderRadius: "0.25rem",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  skeletonValue: {
    display: "block",
    width: "3rem",
    height: "0.6rem",
    borderRadius: "0.25rem",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
} as const;

export default CompactMetadataStack;
