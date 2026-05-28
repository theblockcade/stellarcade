/**
 * EventDigestPanel Component - v1
 *
 * Dense, scrollable panel showing a compact summary of recent contract events.
 *
 * - "Digest" mode: one condensed row per event (timestamp + type badge + payload summary)
 * - Loading skeleton (configurable row count)
 * - Empty state when no events are present
 * - Error state with optional retry
 * - "Clear all" action
 * - Accessible live region so new events are announced to screen readers
 */

import React from 'react';
import { StatusPill } from './StatusPill';
import type { StatusPillTone } from './StatusPill';
import './EventDigestPanel.css';

export type DigestEventSeverity = 'info' | 'success' | 'warning' | 'error';

export interface DigestEvent {
  id: string;
  type: string;
  contractId?: string;
  timestamp: string;
  summary?: string;
  severity?: DigestEventSeverity;
}

export interface EventDigestPanelProps {
  events: DigestEvent[];
  status: 'idle' | 'loading' | 'success' | 'error';
  title?: string;
  maxItems?: number;
  error?: string;
  onRetry?: () => void;
  onClearAll?: () => void;
  className?: string;
  testId?: string;
}

const SEVERITY_TONE: Record<DigestEventSeverity, StatusPillTone> = {
  info: 'neutral',
  success: 'success',
  warning: 'warning',
  error: 'error',
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

function DigestRow({ event, testId }: { event: DigestEvent; testId: string }): JSX.Element {
  const tone = SEVERITY_TONE[event.severity ?? 'info'];
  return (
    <li
      className="edp__row"
      data-testid={`${testId}-row-${event.id}`}
    >
      <time className="edp__time" dateTime={event.timestamp} title={event.timestamp}>
        {formatTime(event.timestamp)}
      </time>

      <StatusPill
        tone={tone}
        label={event.type}
        size="compact"
        testId={`${testId}-pill-${event.id}`}
      />

      {event.contractId && (
        <span className="edp__contract" title={event.contractId}>
          {event.contractId.slice(0, 8)}…
        </span>
      )}

      {event.summary && (
        <span className="edp__summary">{event.summary}</span>
      )}
    </li>
  );
}

export const EventDigestPanel: React.FC<EventDigestPanelProps> = ({
  events,
  status,
  title = 'Recent Activity',
  maxItems = 20,
  error,
  onRetry,
  onClearAll,
  className = '',
  testId = 'event-digest-panel',
}) => {
  const isLoading = status === 'loading';
  const isError = status === 'error';
  const visible = events.slice(0, maxItems);

  return (
    <section
      className={`edp ${className}`}
      data-testid={testId}
      aria-label={title}
      aria-busy={isLoading}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="edp__header">
        <h2 className="edp__title">{title}</h2>

        {onClearAll && events.length > 0 && !isLoading && !isError && (
          <button
            type="button"
            className="edp__clear"
            onClick={onClearAll}
            data-testid={`${testId}-clear`}
            aria-label="Clear all events"
          >
            Clear all
          </button>
        )}
      </header>

      {/* ── Loading ─────────────────────────────────────────────────────── */}
      {isLoading && (
        <ul className="edp__list" aria-hidden="true" data-testid={`${testId}-loading`}>
          {Array.from({ length: 5 }, (_, i) => (
            <li key={i} className="edp__skeleton" />
          ))}
        </ul>
      )}

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {isError && (
        <div
          className="edp__error"
          role="alert"
          aria-live="assertive"
          data-testid={`${testId}-error`}
        >
          <span className="edp__error-text">{error ?? 'Failed to load contract events.'}</span>
          {onRetry && (
            <button
              type="button"
              className="edp__retry"
              onClick={onRetry}
              data-testid={`${testId}-retry`}
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* ── Empty ───────────────────────────────────────────────────────── */}
      {!isLoading && !isError && visible.length === 0 && (
        <p className="edp__empty" role="status" data-testid={`${testId}-empty`}>
          No contract activity yet.
        </p>
      )}

      {/* ── Event rows ──────────────────────────────────────────────────── */}
      {!isLoading && !isError && visible.length > 0 && (
        <>
          <ul
            className="edp__list"
            data-testid={`${testId}-list`}
            aria-label={`${visible.length} contract event${visible.length === 1 ? '' : 's'}`}
          >
            {visible.map((event) => (
              <DigestRow key={event.id} event={event} testId={testId} />
            ))}
          </ul>

          {events.length > maxItems && (
            <p className="edp__overflow" data-testid={`${testId}-overflow`}>
              Showing {maxItems} of {events.length} events
            </p>
          )}
        </>
      )}

      {/* ── Live region for new events ───────────────────────────────────── */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="false"
        className="edp__sr-live"
        data-testid={`${testId}-live`}
      />
    </section>
  );
};

export default EventDigestPanel;
