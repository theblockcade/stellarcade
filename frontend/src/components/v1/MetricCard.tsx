/**
 * MetricCard Component - v1
 *
 * Layout primitive that displays a single KPI metric with:
 * - Loading skeleton region
 * - Error region with optional retry
 * - Trend indicator (up / down / neutral)
 * - Empty / missing-data state
 * - Responsive and accessible markup
 */

import React from 'react';
import './MetricCard.css';

export type MetricCardStatus = 'idle' | 'loading' | 'success' | 'error';
export type MetricTrend = 'up' | 'down' | 'neutral';

export interface MetricCardProps {
  label: string;
  value?: React.ReactNode;
  status?: MetricCardStatus;
  /** Display a percentage or absolute change next to the value. */
  change?: string;
  trend?: MetricTrend;
  /** Secondary helper text shown below the value. */
  caption?: string;
  error?: string;
  onRetry?: () => void;
  className?: string;
  testId?: string;
  /** Accessible description surfaced to assistive technology. */
  ariaLabel?: string;
}

const TREND_ICONS: Record<MetricTrend, string> = {
  up: '▲',
  down: '▼',
  neutral: '—',
};

function TrendChip({
  trend,
  change,
}: {
  trend: MetricTrend;
  change: string;
}): JSX.Element {
  return (
    <span className={`mc__trend mc__trend--${trend}`} aria-label={`Trend: ${trend}, change ${change}`}>
      <span className="mc__trend-icon" aria-hidden="true">
        {TREND_ICONS[trend]}
      </span>
      <span className="mc__trend-change">{change}</span>
    </span>
  );
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  status = 'success',
  change,
  trend = 'neutral',
  caption,
  error,
  onRetry,
  className = '',
  testId = 'metric-card',
  ariaLabel,
}) => {
  const isLoading = status === 'loading';
  const isError = status === 'error';
  const isEmpty = status === 'success' && (value === undefined || value === null || value === '');

  return (
    <article
      className={`mc ${className}`}
      data-testid={testId}
      aria-label={ariaLabel ?? label}
      aria-busy={isLoading}
    >
      <h3 className="mc__label" data-testid={`${testId}-label`}>
        {label}
      </h3>

      {/* ── Loading region ─────────────────────────────────────────────── */}
      {isLoading && (
        <div className="mc__loading" data-testid={`${testId}-loading`} aria-hidden="true">
          <div className="mc__skeleton mc__skeleton--value" />
          <div className="mc__skeleton mc__skeleton--caption" />
        </div>
      )}

      {/* ── Error region ───────────────────────────────────────────────── */}
      {isError && (
        <div
          className="mc__error"
          data-testid={`${testId}-error`}
          role="alert"
          aria-live="assertive"
        >
          <span className="mc__error-text">{error ?? 'Failed to load metric.'}</span>
          {onRetry && (
            <button
              type="button"
              className="mc__retry"
              onClick={onRetry}
              data-testid={`${testId}-retry`}
              aria-label={`Retry loading ${label}`}
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* ── Empty region ───────────────────────────────────────────────── */}
      {isEmpty && (
        <div className="mc__empty" data-testid={`${testId}-empty`}>
          <span className="mc__empty-dash" aria-label="No data">—</span>
        </div>
      )}

      {/* ── Value region ───────────────────────────────────────────────── */}
      {!isLoading && !isError && !isEmpty && (
        <div className="mc__body" data-testid={`${testId}-body`}>
          <span className="mc__value" data-testid={`${testId}-value`}>
            {value}
          </span>
          {change !== undefined && (
            <TrendChip trend={trend} change={change} />
          )}
        </div>
      )}

      {/* ── Caption ────────────────────────────────────────────────────── */}
      {caption && !isLoading && !isError && (
        <p className="mc__caption" data-testid={`${testId}-caption`}>
          {caption}
        </p>
      )}
    </article>
  );
};

export default MetricCard;
