/**
 * CollapsibleStatsGroup — v1
 *
 * Collapsible container for dense stat rows in dashboards.
 * Shows a summary bar when collapsed and reveals all stat
 * items when expanded. Handles loading, error, and empty states.
 */

import React, { useState, useCallback, useId } from 'react';
import './CollapsibleStatsGroup.css';

// ── Types ──────────────────────────────────────────────────────────────────

export type StatItemStatus = 'idle' | 'loading' | 'error';

export interface StatItem {
  id: string;
  label: string;
  value?: React.ReactNode;
  /** Optional secondary text below the value. */
  caption?: string;
  /** "up" | "down" | "neutral" */
  trend?: 'up' | 'down' | 'neutral';
  change?: string;
  status?: StatItemStatus;
  error?: string;
}

export interface CollapsibleStatsGroupProps {
  title: string;
  items: StatItem[];
  /** Summary text shown in the collapsed header bar. */
  summary?: string;
  defaultExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
  className?: string;
  testId?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const TREND_ICONS = { up: '▲', down: '▼', neutral: '—' } as const;

function StatRow({ item, testId }: { item: StatItem; testId: string }) {
  if (item.status === 'loading') {
    return (
      <li className="csg__item csg__item--loading" data-testid={`${testId}-item-${item.id}`} aria-busy>
        <div className="csg__item-skeleton" aria-hidden="true" />
      </li>
    );
  }
  if (item.status === 'error') {
    return (
      <li className="csg__item csg__item--error" data-testid={`${testId}-item-${item.id}`} role="alert">
        <span className="csg__item-label">{item.label}</span>
        <span className="csg__item-error">{item.error ?? 'Failed to load'}</span>
      </li>
    );
  }
  const isEmpty = item.value === undefined || item.value === null || item.value === '';
  return (
    <li className="csg__item" data-testid={`${testId}-item-${item.id}`}>
      <span className="csg__item-label">{item.label}</span>
      <span className="csg__item-right">
        {isEmpty ? (
          <span className="csg__item-empty" aria-label="No data">—</span>
        ) : (
          <>
            <span className="csg__item-value">{item.value}</span>
            {item.trend && item.change && (
              <span
                className={`csg__item-trend csg__item-trend--${item.trend}`}
                aria-label={`${item.trend} ${item.change}`}
              >
                <span aria-hidden="true">{TREND_ICONS[item.trend]}</span>
                {item.change}
              </span>
            )}
          </>
        )}
      </span>
      {item.caption && <span className="csg__item-caption">{item.caption}</span>}
    </li>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export const CollapsibleStatsGroup: React.FC<CollapsibleStatsGroupProps> = ({
  title,
  items,
  summary,
  defaultExpanded = false,
  onToggle,
  isLoading = false,
  error,
  onRetry,
  className = '',
  testId = 'collapsible-stats-group',
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const panelId = useId();
  const headerId = useId();

  const handleToggle = useCallback(() => {
    if (isLoading) return;
    setExpanded((prev) => {
      const next = !prev;
      onToggle?.(next);
      return next;
    });
  }, [isLoading, onToggle]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggle();
      }
    },
    [handleToggle],
  );

  return (
    <div
      className={`csg ${expanded ? 'csg--expanded' : ''} ${className}`}
      data-testid={testId}
    >
      {/* ── Header / toggle ──────────────────────────────────────────── */}
      <button
        type="button"
        className="csg__header"
        id={headerId}
        aria-expanded={expanded}
        aria-controls={panelId}
        aria-busy={isLoading}
        data-testid={`${testId}-toggle`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
      >
        <span className="csg__title">{title}</span>
        {!expanded && summary && (
          <span className="csg__summary" data-testid={`${testId}-summary`}>
            {summary}
          </span>
        )}
        <span className="csg__chevron" aria-hidden="true">
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {/* ── Content panel ────────────────────────────────────────────── */}
      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        className="csg__panel"
        hidden={!expanded}
        data-testid={`${testId}-panel`}
      >
        {error ? (
          <div className="csg__error" role="alert" data-testid={`${testId}-error`}>
            <span>{error}</span>
            {onRetry && (
              <button type="button" className="csg__retry" onClick={onRetry} data-testid={`${testId}-retry`}>
                Retry
              </button>
            )}
          </div>
        ) : items.length === 0 && !isLoading ? (
          <p className="csg__empty" data-testid={`${testId}-empty`}>
            No stats available.
          </p>
        ) : (
          <ul className="csg__list" aria-label={`${title} stats`}>
            {items.map((item) => (
              <StatRow key={item.id} item={item} testId={testId} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

CollapsibleStatsGroup.displayName = 'CollapsibleStatsGroup';

export default CollapsibleStatsGroup;
