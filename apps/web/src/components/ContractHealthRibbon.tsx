"use client";

import React from "react";
import { StatusPill } from "./StatusPill";
import type { StatusPillTone } from "./StatusPill";
import "./ContractHealthRibbon.css";

export type ContractHealthStatus =
  | "healthy"
  | "degraded"
  | "error"
  | "loading"
  | "unknown";

export type ContractHealthRibbonVariant = "full" | "compact";

export interface ContractHealthRibbonProps {
  contractId: string;
  status: ContractHealthStatus;
  latencyMs?: number;
  errorMessage?: string;
  variant?: ContractHealthRibbonVariant;
  className?: string;
  testId?: string;
  ariaLabel?: string;
}

const STATUS_TONE: Record<ContractHealthStatus, StatusPillTone> = {
  healthy: "success",
  degraded: "warning",
  error: "error",
  loading: "pending",
  unknown: "neutral",
};

const STATUS_LABEL: Record<ContractHealthStatus, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  error: "Error",
  loading: "Checking",
  unknown: "Unknown",
};

const STATUS_ICON: Record<ContractHealthStatus, string> = {
  healthy: "✓",
  degraded: "⚠",
  error: "✕",
  loading: "…",
  unknown: "?",
};

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export const ContractHealthRibbon: React.FC<ContractHealthRibbonProps> = ({
  contractId,
  status,
  latencyMs,
  errorMessage,
  variant = "full",
  className = "",
  testId = "contract-health-ribbon",
  ariaLabel,
}) => {
  const tone = STATUS_TONE[status] ?? "neutral";
  const label = STATUS_LABEL[status] ?? "Unknown";
  const icon = STATUS_ICON[status] ?? "?";
  const isCompact = variant === "compact";

  const containerClasses = [
    "chr",
    `chr--${status}`,
    `chr--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const resolvedAriaLabel =
    ariaLabel ??
    `${contractId} contract health: ${label}${latencyMs !== undefined ? `, latency ${formatLatency(latencyMs)}` : ""}`;

  return (
    <div
      className={containerClasses}
      data-testid={testId}
      role="status"
      aria-label={resolvedAriaLabel}
      aria-live="polite"
    >
      <span className={`chr__dot chr__dot--${status}`} aria-hidden="true">
        {isCompact ? icon : null}
      </span>

      {!isCompact && (
        <span className="chr__label" data-testid={`${testId}-label`}>
          {contractId}
        </span>
      )}

      <StatusPill
        tone={tone}
        label={label}
        size="compact"
        testId={`${testId}-pill`}
      />

      {!isCompact && latencyMs !== undefined && status !== "error" && status !== "loading" && (
        <span
          className="chr__latency"
          data-testid={`${testId}-latency`}
          aria-label={`Latency: ${formatLatency(latencyMs)}`}
        >
          {formatLatency(latencyMs)}
        </span>
      )}

      {!isCompact && status === "error" && errorMessage && (
        <span
          className="chr__error-msg"
          data-testid={`${testId}-error-msg`}
          role="alert"
        >
          {errorMessage}
        </span>
      )}
    </div>
  );
};

ContractHealthRibbon.displayName = "ContractHealthRibbon";

export default ContractHealthRibbon;
