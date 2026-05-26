/**
 * ContractHealthRibbon Component - v1
 *
 * A compact ribbon that surfaces contract health status on both detail and
 * overview surfaces. Handles loading, error, degraded, healthy, and
 * not-configured states explicitly.
 *
 * Usage on a detail surface (full label + metrics):
 *   <ContractHealthRibbon contractId="prize-pool" status="healthy" latencyMs={42} />
 *
 * Usage on an overview surface (compact, icon-only label):
 *   <ContractHealthRibbon contractId="prize-pool" status="degraded" variant="compact" />
 */

import React from 'react';
import { StatusPill } from './StatusPill';
import './ContractHealthRibbon.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ContractHealthStatus =
  | 'healthy'
  | 'degraded'
  | 'error'
  | 'loading'
  | 'unknown';

export type ContractHealthRibbonVariant = 'full' | 'compact';

export interface ContractHealthRibbonProps {
  /** Human-readable contract identifier shown in the ribbon label. */
  contractId: string;
  /** Current health status of the contract. */
  status: ContractHealthStatus;
  /** Optional last-observed round-trip latency in milliseconds. */
  latencyMs?: number;
  /** Optional human-readable error message shown in error state. */
  errorMessage?: string;
  /** `full` shows label + metrics; `compact` shows icon + status only. */
  variant?: ContractHealthRibbonVariant;
  /** Additional CSS class. */
  className?: string;
  /** Test ID for automated testing. */
  testId?: string;
  /** Accessible label override. */
  ariaLabel?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_TONE: Record<ContractHealthStatus, string> = {
  healthy: 'success',
  degraded: 'warning',
  error: 'error',
  loading: 'pending',
  unknown: 'neutral',
};

const STATUS_LABEL: Record<ContractHealthStatus, string> = {
  healthy: 'Healthy',
  degraded: 'Degraded',
  error: 'Error',
  loading: 'Checking',
  unknown: 'Unknown',
};

const STATUS_ICON: Record<ContractHealthStatus, string> = {
  healthy: '✓',
  degraded: '⚠',
  error: '✕',
  loading: '…',
  unknown: '?',
};

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ContractHealthRibbon: React.FC<ContractHealthRibbonProps> = ({
  contractId,
  status,
  latencyMs,
  errorMessage,
  variant = 'full',
  className = '',
  testId = 'contract-health-ribbon',
  ariaLabel,
}) => {
  const tone = STATUS_TONE[status] ?? 'neutral';
  const label = STATUS_LABEL[status] ?? 'Unknown';
  const icon = STATUS_ICON[status] ?? '?';
  const isCompact = variant === 'compact';

  const containerClasses = [
    'chr',
    `chr--${status}`,
    `chr--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const resolvedAriaLabel =
    ariaLabel ??
    `${contractId} contract health: ${label}${latencyMs !== undefined ? `, latency ${formatLatency(latencyMs)}` : ''}`;

  return (
    <div
      className={containerClasses}
      data-testid={testId}
      role="status"
      aria-label={resolvedAriaLabel}
      aria-live="polite"
    >
      {/* ── Icon dot ──────────────────────────────────────────────────────── */}
      <span
        className={`chr__dot chr__dot--${status}`}
        aria-hidden="true"
      >
        {isCompact ? icon : null}
      </span>

      {/* ── Label block (full variant only) ───────────────────────────────── */}
      {!isCompact && (
        <span className="chr__label" data-testid={`${testId}-label`}>
          {contractId}
        </span>
      )}

      {/* ── Status pill ───────────────────────────────────────────────────── */}
      <StatusPill
        tone={tone}
        label={label}
        size="compact"
        testId={`${testId}-pill`}
      />

      {/* ── Latency badge (full variant, healthy/degraded only) ───────────── */}
      {!isCompact && latencyMs !== undefined && status !== 'error' && status !== 'loading' && (
        <span
          className="chr__latency"
          data-testid={`${testId}-latency`}
          aria-label={`Latency: ${formatLatency(latencyMs)}`}
        >
          {formatLatency(latencyMs)}
        </span>
      )}

      {/* ── Error message (full variant, error state only) ────────────────── */}
      {!isCompact && status === 'error' && errorMessage && (
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

ContractHealthRibbon.displayName = 'ContractHealthRibbon';

export default ContractHealthRibbon;
