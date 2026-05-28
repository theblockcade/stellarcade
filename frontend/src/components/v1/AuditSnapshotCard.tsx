/**
 * AuditSnapshotCard Component
 * 
 * Compact cards displaying audit information in narrow detail layouts.
 * Provides essential audit data in a space-efficient format with expandable details.
 * 
 * @module components/v1/AuditSnapshotCard
 */

import React, { useState } from 'react';
import { StatusPill } from './StatusPill';
import './AuditSnapshotCard.css';

export interface AuditSnapshot {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  target?: string;
  details?: Record<string, any>;
  metadata?: {
    ip?: string;
    userAgent?: string;
    location?: string;
    duration?: number;
  };
}

export interface AuditSnapshotCardProps {
  /** Audit data to display */
  audit: AuditSnapshot;
  /** Compact layout variant */
  variant?: 'minimal' | 'standard' | 'detailed';
  /** Show expand/collapse toggle */
  expandable?: boolean;
  /** Initially expanded state */
  defaultExpanded?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /** Click handler for the card */
  onClick?: (audit: AuditSnapshot) => void;
  /** Show relative time instead of absolute */
  showRelativeTime?: boolean;
}

const formatTimestamp = (timestamp: string, relative: boolean = false): string => {
  const date = new Date(timestamp);
  
  if (relative) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
  }
  
  return date.toLocaleString();
};

const truncateString = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return `${str.substring(0, maxLength - 3)}...`;
};

export const AuditSnapshotCard: React.FC<AuditSnapshotCardProps> = ({
  audit,
  variant = 'standard',
  expandable = false,
  defaultExpanded = false,
  className = '',
  testId = 'audit-snapshot-card',
  onClick,
  showRelativeTime = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const containerClasses = [
    'audit-snapshot-card',
    `audit-snapshot-card--${variant}`,
    expandable ? 'audit-snapshot-card--expandable' : '',
    isExpanded ? 'audit-snapshot-card--expanded' : '',
    onClick ? 'audit-snapshot-card--clickable' : '',
    className,
  ].filter(Boolean).join(' ');

  const handleCardClick = () => {
    if (onClick) {
      onClick(audit);
    }
  };

  const handleExpandToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (expandable) {
        setIsExpanded(!isExpanded);
      } else if (onClick) {
        onClick(audit);
      }
    }
  };

  const renderDetails = () => {
    if (!audit.details && !audit.metadata) return null;

    const details = audit.details || {};
    const metadata = audit.metadata || {};

    return (
      <div className="audit-snapshot-card__details">
        {Object.keys(details).length > 0 && (
          <div className="audit-snapshot-card__section">
            <h4 className="audit-snapshot-card__section-title">Details</h4>
            <dl className="audit-snapshot-card__detail-list">
              {Object.entries(details).map(([key, value]) => (
                <div key={key} className="audit-snapshot-card__detail-item">
                  <dt className="audit-snapshot-card__detail-key">{key}</dt>
                  <dd className="audit-snapshot-card__detail-value">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
        
        {Object.keys(metadata).length > 0 && (
          <div className="audit-snapshot-card__section">
            <h4 className="audit-snapshot-card__section-title">Metadata</h4>
            <dl className="audit-snapshot-card__detail-list">
              {metadata.ip && (
                <div className="audit-snapshot-card__detail-item">
                  <dt className="audit-snapshot-card__detail-key">IP Address</dt>
                  <dd className="audit-snapshot-card__detail-value">{metadata.ip}</dd>
                </div>
              )}
              {metadata.location && (
                <div className="audit-snapshot-card__detail-item">
                  <dt className="audit-snapshot-card__detail-key">Location</dt>
                  <dd className="audit-snapshot-card__detail-value">{metadata.location}</dd>
                </div>
              )}
              {metadata.duration && (
                <div className="audit-snapshot-card__detail-item">
                  <dt className="audit-snapshot-card__detail-key">Duration</dt>
                  <dd className="audit-snapshot-card__detail-value">{metadata.duration}ms</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    );
  };

  return (
    <article
      className={containerClasses}
      data-testid={testId}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={onClick || expandable ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      aria-expanded={expandable ? isExpanded : undefined}
    >
      <header className="audit-snapshot-card__header">
        <div className="audit-snapshot-card__primary">
          <div className="audit-snapshot-card__action-info">
            <h3 className="audit-snapshot-card__action">
              {variant === 'minimal' ? truncateString(audit.action, 20) : audit.action}
            </h3>
            <p className="audit-snapshot-card__actor">
              by {variant === 'minimal' ? truncateString(audit.actor, 15) : audit.actor}
            </p>
          </div>
          
          <StatusPill 
            tone={audit.status} 
            label={audit.status} 
            size="compact"
            testId={`${testId}-status`}
          />
        </div>
        
        <div className="audit-snapshot-card__secondary">
          <time 
            className="audit-snapshot-card__timestamp"
            dateTime={audit.timestamp}
            title={formatTimestamp(audit.timestamp, false)}
          >
            {formatTimestamp(audit.timestamp, showRelativeTime)}
          </time>
          
          {expandable && (
            <button
              type="button"
              className="audit-snapshot-card__expand-toggle"
              onClick={handleExpandToggle}
              aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
              data-testid={`${testId}-expand-toggle`}
            >
              <span className="audit-snapshot-card__expand-icon" aria-hidden="true">
                {isExpanded ? '−' : '+'}
              </span>
            </button>
          )}
        </div>
      </header>
      
      {audit.target && variant !== 'minimal' && (
        <div className="audit-snapshot-card__target">
          <span className="audit-snapshot-card__target-label">Target:</span>
          <span className="audit-snapshot-card__target-value">{audit.target}</span>
        </div>
      )}
      
      {expandable && isExpanded && renderDetails()}
    </article>
  );
};

AuditSnapshotCard.displayName = 'AuditSnapshotCard';

export default AuditSnapshotCard;