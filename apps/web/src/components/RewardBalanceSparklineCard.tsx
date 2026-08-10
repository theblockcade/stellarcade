/**
 * RewardBalanceSparklineCard — v1
 *
 * Compact card for dashboard reward-balance summaries.
 * Renders an inline SVG sparkline from a series of data points,
 * the current balance, and a trend delta badge.
 *
 * No external charting library — sparkline is computed from
 * the `dataPoints` array and rendered as a single SVG polyline.
 */

import React, { useMemo } from 'react';
import './RewardBalanceSparklineCard.css';

// ── Types ──────────────────────────────────────────────────────────────────

export type SparklineTrend = 'up' | 'down' | 'flat';
export type RewardCardStatus = 'idle' | 'loading' | 'error';

export interface RewardBalanceSparklineCardProps {
  /** Card title / reward token name. */
  label: string;
  /** Current balance value (displayed as-is). */
  balance?: string;
  /** Secondary currency / fiat equivalent. */
  balanceEquivalent?: string;
  /** Historical data points for the sparkline (oldest → newest). */
  dataPoints?: number[];
  /** Percentage or absolute change string, e.g. "+4.2%". */
  change?: string;
  trend?: SparklineTrend;
  status?: RewardCardStatus;
  error?: string;
  onRetry?: () => void;
  className?: string;
  testId?: string;
  ariaLabel?: string;
}

// ── Sparkline helper ───────────────────────────────────────────────────────

const SPARKLINE_W = 80;
const SPARKLINE_H = 28;
const SPARKLINE_PADDING = 2;

function buildPolylinePoints(data: number[]): string {
  if (data.length < 2) return '';
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const usableW = SPARKLINE_W - SPARKLINE_PADDING * 2;
  const usableH = SPARKLINE_H - SPARKLINE_PADDING * 2;

  return data
    .map((v, i) => {
      const x = SPARKLINE_PADDING + (i / (data.length - 1)) * usableW;
      const y = SPARKLINE_PADDING + (1 - (v - min) / range) * usableH;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

const TREND_ICONS: Record<SparklineTrend, string> = {
  up: '▲',
  down: '▼',
  flat: '—',
};

// ── Component ──────────────────────────────────────────────────────────────

export const RewardBalanceSparklineCard: React.FC<RewardBalanceSparklineCardProps> = ({
  label,
  balance,
  balanceEquivalent,
  dataPoints = [],
  change,
  trend = 'flat',
  status = 'idle',
  error,
  onRetry,
  className = '',
  testId = 'reward-balance-sparkline-card',
  ariaLabel,
}) => {
  const polylinePoints = useMemo(() => buildPolylinePoints(dataPoints), [dataPoints]);
  const isLoading = status === 'loading';
  const isError = status === 'error';
  const isEmpty = !isLoading && !isError && (balance === undefined || balance === '');
  const hasSparkline = dataPoints.length >= 2;

  return (
    <article
      className={`rbsc ${className}`}
      data-testid={testId}
      aria-label={ariaLabel ?? `${label} balance card`}
      aria-busy={isLoading}
    >
      {/* ── Label row ────────────────────────────────────────────────── */}
      <div className="rbsc__header">
        <span className="rbsc__label" data-testid={`${testId}-label`}>{label}</span>
        {!isLoading && !isError && change !== undefined && (
          <span
            className={`rbsc__change rbsc__change--${trend}`}
            data-testid={`${testId}-change`}
            aria-label={`${trend} ${change}`}
          >
            <span aria-hidden="true">{TREND_ICONS[trend]}</span>
            {change}
          </span>
        )}
      </div>

      {/* ── Loading ──────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="rbsc__loading" aria-hidden="true" data-testid={`${testId}-loading`}>
          <div className="rbsc__skeleton rbsc__skeleton--balance" />
          <div className="rbsc__skeleton rbsc__skeleton--sparkline" />
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────────────── */}
      {isError && (
        <div className="rbsc__error" role="alert" data-testid={`${testId}-error`}>
          <span className="rbsc__error-text">{error ?? 'Failed to load balance.'}</span>
          {onRetry && (
            <button type="button" className="rbsc__retry" onClick={onRetry} data-testid={`${testId}-retry`}>
              Retry
            </button>
          )}
        </div>
      )}

      {/* ── Empty ────────────────────────────────────────────────────── */}
      {isEmpty && (
        <div className="rbsc__empty" data-testid={`${testId}-empty`}>
          <span aria-label="No balance data">—</span>
        </div>
      )}

      {/* ── Value + sparkline ────────────────────────────────────────── */}
      {!isLoading && !isError && !isEmpty && (
        <div className="rbsc__body">
          <div className="rbsc__balance-block">
            <span className="rbsc__balance" data-testid={`${testId}-balance`}>
              {balance}
            </span>
            {balanceEquivalent && (
              <span className="rbsc__equivalent" data-testid={`${testId}-equivalent`}>
                {balanceEquivalent}
              </span>
            )}
          </div>

          {hasSparkline && (
            <svg
              className={`rbsc__sparkline rbsc__sparkline--${trend}`}
              width={SPARKLINE_W}
              height={SPARKLINE_H}
              viewBox={`0 0 ${SPARKLINE_W} ${SPARKLINE_H}`}
              aria-hidden="true"
              data-testid={`${testId}-sparkline`}
            >
              <polyline
                className="rbsc__sparkline-line"
                points={polylinePoints}
                fill="none"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      )}
    </article>
  );
};

RewardBalanceSparklineCard.displayName = 'RewardBalanceSparklineCard';

export default RewardBalanceSparklineCard;
