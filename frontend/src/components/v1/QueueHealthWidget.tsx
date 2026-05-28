/**
 * QueueHealthWidget Component
 * 
 * Displays live queue health information including participation levels,
 * wait times, and system status for gaming queues and matchmaking.
 * 
 * @module components/v1/QueueHealthWidget
 */

import React, { useEffect, useState } from 'react';
import { StatusPill } from './StatusPill';
import './QueueHealthWidget.css';

export interface QueueMetrics {
  playersInQueue: number;
  averageWaitTime: number; // in seconds
  estimatedWaitTime: number; // in seconds
  activeMatches: number;
  queueHealth: 'healthy' | 'degraded' | 'critical' | 'offline';
  lastUpdated: string;
}

export interface QueueHealthWidgetProps {
  /** Current queue metrics */
  metrics?: QueueMetrics;
  /** Queue name/identifier */
  queueName?: string;
  /** Widget size variant */
  size?: 'compact' | 'default' | 'detailed';
  /** Show detailed breakdown */
  showDetails?: boolean;
  /** Auto-refresh interval in seconds */
  refreshInterval?: number;
  /** Callback for manual refresh */
  onRefresh?: () => void;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string;
  /** Additional CSS class */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

const DEFAULT_METRICS: QueueMetrics = {
  playersInQueue: 0,
  averageWaitTime: 0,
  estimatedWaitTime: 0,
  activeMatches: 0,
  queueHealth: 'offline',
  lastUpdated: new Date().toISOString(),
};

const formatWaitTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
};

const formatRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const updated = new Date(timestamp);
  const diffMs = now.getTime() - updated.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  return `${Math.floor(diffSeconds / 3600)}h ago`;
};

const getHealthTone = (health: QueueMetrics['queueHealth']) => {
  switch (health) {
    case 'healthy': return 'success';
    case 'degraded': return 'warning';
    case 'critical': return 'error';
    case 'offline': return 'neutral';
    default: return 'neutral';
  }
};

const getHealthLabel = (health: QueueMetrics['queueHealth']) => {
  switch (health) {
    case 'healthy': return 'Healthy';
    case 'degraded': return 'Degraded';
    case 'critical': return 'Critical';
    case 'offline': return 'Offline';
    default: return 'Unknown';
  }
};

export const QueueHealthWidget: React.FC<QueueHealthWidgetProps> = ({
  metrics,
  queueName = 'Game Queue',
  size = 'default',
  showDetails = false,
  refreshInterval = 30,
  onRefresh,
  loading = false,
  error,
  className = '',
  testId = 'queue-health-widget',
}) => {
  const [timeUntilRefresh, setTimeUntilRefresh] = useState<number>(refreshInterval);

  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      setTimeUntilRefresh((prev) => {
        if (prev <= 1) {
          if (onRefresh) {
            onRefresh();
          }
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [refreshInterval, onRefresh]);

  const containerClasses = [
    'queue-health-widget',
    `queue-health-widget--${size}`,
    loading ? 'queue-health-widget--loading' : '',
    error ? 'queue-health-widget--error' : '',
    className,
  ].filter(Boolean).join(' ');

  const handleManualRefresh = () => {
    if (onRefresh && !loading) {
      onRefresh();
      setTimeUntilRefresh(refreshInterval);
    }
  };

  if (error) {
    return (
      <div className={containerClasses} data-testid={`${testId}-error`} role="alert">
        <div className="queue-health-widget__error">
          <StatusPill tone="error" label="Error" size="compact" />
          <p className="queue-health-widget__error-message">{error}</p>
          {onRefresh && (
            <button
              type="button"
              className="queue-health-widget__retry-button"
              onClick={handleManualRefresh}
              disabled={loading}
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  if (loading && (!metrics || !metrics.lastUpdated)) {
    return (
      <div className={containerClasses} data-testid={`${testId}-loading`} role="status" aria-live="polite">
        <div className="queue-health-widget__loading">
          <div className="queue-health-widget__skeleton queue-health-widget__skeleton--header" />
          <div className="queue-health-widget__skeleton queue-health-widget__skeleton--metrics" />
          <div className="queue-health-widget__skeleton queue-health-widget__skeleton--status" />
        </div>
      </div>
    );
  }

  const currentMetrics = metrics || DEFAULT_METRICS;

  return (
    <div className={containerClasses} data-testid={testId}>
      <header className="queue-health-widget__header">
        <div className="queue-health-widget__title-section">
          <h3 className="queue-health-widget__title">{queueName}</h3>
          <StatusPill 
            tone={getHealthTone(currentMetrics.queueHealth)} 
            label={getHealthLabel(currentMetrics.queueHealth)}
            size="compact"
            testId={`${testId}-health-status`}
          />
        </div>
        
        {onRefresh && (
          <button
            type="button"
            className="queue-health-widget__refresh-button"
            onClick={handleManualRefresh}
            disabled={loading}
            aria-label="Refresh queue data"
            data-testid={`${testId}-refresh`}
          >
            <span className="queue-health-widget__refresh-icon" aria-hidden="true">
              ↻
            </span>
          </button>
        )}
      </header>

      <div className="queue-health-widget__metrics">
        <div className="queue-health-widget__metric-group">
          <div className="queue-health-widget__metric">
            <span className="queue-health-widget__metric-value">
              {loading ? '—' : currentMetrics.playersInQueue}
            </span>
            <span className="queue-health-widget__metric-label">
              {size === 'compact' ? 'Players' : 'In Queue'}
            </span>
          </div>
          
          <div className="queue-health-widget__metric">
            <span className="queue-health-widget__metric-value">
              {loading ? '—' : formatWaitTime(currentMetrics.estimatedWaitTime)}
            </span>
            <span className="queue-health-widget__metric-label">
              {size === 'compact' ? 'Wait' : 'Est. Wait'}
            </span>
          </div>
          
          {(size === 'detailed' || showDetails) && (
            <div className="queue-health-widget__metric">
              <span className="queue-health-widget__metric-value">
                {loading ? '—' : currentMetrics.activeMatches}
              </span>
              <span className="queue-health-widget__metric-label">Active</span>
            </div>
          )}
        </div>
      </div>

      {(size === 'detailed' || showDetails) && (
        <div className="queue-health-widget__details">
          <div className="queue-health-widget__detail-row">
            <span className="queue-health-widget__detail-label">Avg. Wait:</span>
            <span className="queue-health-widget__detail-value">
              {loading ? '—' : formatWaitTime(currentMetrics.averageWaitTime)}
            </span>
          </div>
          
          <div className="queue-health-widget__detail-row">
            <span className="queue-health-widget__detail-label">Updated:</span>
            <span className="queue-health-widget__detail-value">
              {loading ? '—' : formatRelativeTime(currentMetrics.lastUpdated)}
            </span>
          </div>
        </div>
      )}

      {refreshInterval > 0 && onRefresh && (
        <div className="queue-health-widget__refresh-indicator">
          <div 
            className="queue-health-widget__refresh-progress"
            style={{
              '--progress': `${((refreshInterval - timeUntilRefresh) / refreshInterval) * 100}%`
            } as React.CSSProperties}
          />
          <span className="queue-health-widget__refresh-countdown">
            Next update in {timeUntilRefresh}s
          </span>
        </div>
      )}
    </div>
  );
};

QueueHealthWidget.displayName = 'QueueHealthWidget';

export default QueueHealthWidget;
