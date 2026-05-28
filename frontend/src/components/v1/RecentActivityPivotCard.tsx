import React from 'react';
import { StatusPill } from './StatusPill';
import type { StatusToneVariant } from '../../types/status-tone';
import './RecentActivityPivotCard.css';

export type PivotView = 'audit' | 'wallet';

export interface ActivityItem {
  id: string;
  label: string;
  summary: string;
  timestampLabel?: string;
  tone?: StatusToneVariant;
}

export interface RecentActivityPivotCardProps {
  /** Currently active pivot tab. */
  activeView: PivotView;
  onViewChange: (view: PivotView) => void;
  auditItems: ActivityItem[];
  walletItems: ActivityItem[];
  emptyMessage?: string;
  className?: string;
  testId?: string;
}

/**
 * RecentActivityPivotCard — tabbed card showing recent audit or wallet activity.
 */
export const RecentActivityPivotCard: React.FC<RecentActivityPivotCardProps> = ({
  activeView,
  onViewChange,
  auditItems,
  walletItems,
  emptyMessage = 'No recent activity.',
  className = '',
  testId = 'recent-activity-pivot-card',
}) => {
  const items = activeView === 'audit' ? auditItems : walletItems;

  return (
    <div
      className={`rapc ${className}`.trim()}
      data-testid={testId}
    >
      <div className="rapc__tabs" role="tablist" aria-label="Activity view">
        {(['audit', 'wallet'] as PivotView[]).map((view) => (
          <button
            key={view}
            role="tab"
            type="button"
            aria-selected={activeView === view}
            className={`rapc__tab${activeView === view ? ' rapc__tab--active' : ''}`}
            onClick={() => onViewChange(view)}
            data-testid={`${testId}-tab-${view}`}
          >
            {view === 'audit' ? 'Audit' : 'Wallet'}
          </button>
        ))}
      </div>

      <ul
        className="rapc__list"
        role="tabpanel"
        aria-label={`${activeView} activity`}
        data-testid={`${testId}-panel`}
      >
        {items.length === 0 ? (
          <li className="rapc__empty" aria-live="polite">{emptyMessage}</li>
        ) : (
          items.map((item) => (
            <li key={item.id} className="rapc__item" data-testid={`${testId}-item-${item.id}`}>
              <div className="rapc__item-header">
                <span className="rapc__item-label">{item.label}</span>
                {item.tone && <StatusPill tone={item.tone} label={item.tone} />}
                {item.timestampLabel && (
                  <span className="rapc__item-time">{item.timestampLabel}</span>
                )}
              </div>
              <p className="rapc__item-summary">{item.summary}</p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

RecentActivityPivotCard.displayName = 'RecentActivityPivotCard';
export default RecentActivityPivotCard;
