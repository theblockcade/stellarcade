import React from 'react';
import { StatusPill } from './StatusPill';
import type { QueueMetrics } from './QueueHealthWidget';
import './QueueStateMiniPanel.css';

export type QueuePanelContext = 'lobby' | 'live-match';

export interface QueueStateMiniPanelProps {
  metrics?: QueueMetrics;
  title?: string;
  context?: QueuePanelContext;
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  className?: string;
  testId?: string;
}

const HEALTH_TONE: Record<QueueMetrics['queueHealth'], 'success' | 'warning' | 'error' | 'neutral'> = {
  healthy: 'success',
  degraded: 'warning',
  critical: 'error',
  offline: 'neutral',
};

const HEALTH_LABEL: Record<QueueMetrics['queueHealth'], string> = {
  healthy: 'Healthy',
  degraded: 'Degraded',
  critical: 'Critical',
  offline: 'Offline',
};

function formatWait(seconds: number): string {
  if (seconds <= 0) return '—';
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function formatRelative(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export const QueueStateMiniPanel: React.FC<QueueStateMiniPanelProps> = ({
  metrics,
  title,
  context = 'lobby',
  loading = false,
  error,
  onRefresh,
  className = '',
  testId = 'queue-state-mini-panel',
}) => {
  const resolvedTitle = title ?? (context === 'live-match' ? 'Match Queue' : 'Queue Status');

  const containerClass = [
    'queue-state-mini-panel',
    `queue-state-mini-panel--${context}`,
    className,
  ].filter(Boolean).join(' ');

  const isLive = context === 'live-match' && metrics?.queueHealth !== 'offline';

  if (loading && !metrics) {
    return (
      <div className={containerClass} data-testid={`${testId}-loading`} role="status" aria-live="polite">
        <div className="queue-state-mini-panel__loading">
          <div className="queue-state-mini-panel__skeleton queue-state-mini-panel__skeleton--title" />
          <div className="queue-state-mini-panel__skeleton queue-state-mini-panel__skeleton--metrics" />
          <div className="queue-state-mini-panel__skeleton queue-state-mini-panel__skeleton--footer" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerClass} data-testid={`${testId}-error`} role="alert">
        <div className="queue-state-mini-panel__error">
          <p className="queue-state-mini-panel__error-message">{error}</p>
          {onRefresh && (
            <button
              type="button"
              className="queue-state-mini-panel__retry-btn"
              onClick={onRefresh}
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  const current = metrics ?? {
    playersInQueue: 0,
    averageWaitTime: 0,
    estimatedWaitTime: 0,
    activeMatches: 0,
    queueHealth: 'offline' as const,
    lastUpdated: new Date().toISOString(),
  };

  return (
    <div className={containerClass} data-testid={testId}>
      <header className="queue-state-mini-panel__header">
        <div className="queue-state-mini-panel__title-row">
          <span
            className={[
              'queue-state-mini-panel__context-dot',
              isLive ? 'queue-state-mini-panel__context-dot--pulsing' : '',
            ].filter(Boolean).join(' ')}
            aria-hidden="true"
          />
          <h3 className="queue-state-mini-panel__title">{resolvedTitle}</h3>
          <StatusPill
            tone={HEALTH_TONE[current.queueHealth]}
            label={HEALTH_LABEL[current.queueHealth]}
            size="compact"
            testId={`${testId}-health`}
          />
        </div>
        {onRefresh && (
          <button
            type="button"
            className="queue-state-mini-panel__refresh-btn"
            onClick={onRefresh}
            disabled={loading}
            aria-label="Refresh queue status"
            data-testid={`${testId}-refresh`}
          >
            <span aria-hidden="true">↻</span>
          </button>
        )}
      </header>

      <div className="queue-state-mini-panel__metrics" data-testid={`${testId}-metrics`}>
        <div className="queue-state-mini-panel__metric">
          <span className="queue-state-mini-panel__metric-value">
            {loading ? '—' : current.playersInQueue}
          </span>
          <span className="queue-state-mini-panel__metric-label">Players</span>
        </div>
        <div className="queue-state-mini-panel__metric">
          <span className="queue-state-mini-panel__metric-value">
            {loading ? '—' : formatWait(current.estimatedWaitTime)}
          </span>
          <span className="queue-state-mini-panel__metric-label">Est. Wait</span>
        </div>
        <div className="queue-state-mini-panel__metric">
          <span className="queue-state-mini-panel__metric-value">
            {loading ? '—' : current.activeMatches}
          </span>
          <span className="queue-state-mini-panel__metric-label">Active</span>
        </div>
      </div>

      <footer className="queue-state-mini-panel__footer">
        <span className="queue-state-mini-panel__status-label">
          {context === 'live-match' ? 'Live match' : 'Lobby queue'}
        </span>
        <span className="queue-state-mini-panel__last-updated" data-testid={`${testId}-updated`}>
          {loading ? 'Updating…' : formatRelative(current.lastUpdated)}
        </span>
      </footer>
    </div>
  );
};

QueueStateMiniPanel.displayName = 'QueueStateMiniPanel';

export default QueueStateMiniPanel;
