"use client";

import React, { useState } from "react";
import { StatusPill } from "./StatusPill";
import "./AuditSnapshotCard.css";

export interface AuditSnapshot {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  status: "success" | "warning" | "error" | "pending";
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
  audit: AuditSnapshot;
  variant?: "minimal" | "standard" | "detailed";
  expandable?: boolean;
  defaultExpanded?: boolean;
  className?: string;
  testId?: string;
  onClick?: (audit: AuditSnapshot) => void;
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

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
  }
  return date.toLocaleString();
};

export const AuditSnapshotCard: React.FC<AuditSnapshotCardProps> = ({
  audit,
  variant = "standard",
  expandable = false,
  defaultExpanded = false,
  className = "",
  testId = "audit-snapshot-card",
  onClick,
  showRelativeTime = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const containerClasses = [
    "audit-snapshot-card",
    `audit-snapshot-card--${variant}`,
    expandable ? "audit-snapshot-card--expandable" : "",
    isExpanded ? "audit-snapshot-card--expanded" : "",
    onClick ? "audit-snapshot-card--clickable" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const handleCardClick = () => {
    if (onClick) {
      onClick(audit);
    }
  };

  const handleExpandToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <article
      className={containerClasses}
      data-testid={testId}
      onClick={handleCardClick}
      role={onClick ? "button" : undefined}
      aria-expanded={expandable ? isExpanded : undefined}
    >
      <header className="audit-snapshot-card__header">
        <div className="audit-snapshot-card__primary">
          <div className="audit-snapshot-card__action-info">
            <h3 className="audit-snapshot-card__action">{audit.action}</h3>
            <p className="audit-snapshot-card__actor">by {audit.actor}</p>
          </div>

          <StatusPill
            tone={audit.status}
            label={audit.status}
            size="compact"
            testId={`${testId}-status`}
          />
        </div>

        <div className="audit-snapshot-card__secondary">
          <time className="audit-snapshot-card__timestamp" dateTime={audit.timestamp}>
            {formatTimestamp(audit.timestamp, showRelativeTime)}
          </time>

          {expandable && (
            <button
              type="button"
              className="audit-snapshot-card__expand-toggle"
              onClick={handleExpandToggle}
              aria-label={isExpanded ? "Collapse details" : "Expand details"}
              data-testid={`${testId}-expand-toggle`}
            >
              <span className="audit-snapshot-card__expand-icon" aria-hidden="true">
                {isExpanded ? "−" : "+"}
              </span>
            </button>
          )}
        </div>
      </header>

      {expandable && isExpanded && audit.details && (
        <div className="audit-snapshot-card__details" data-testid={`${testId}-details`}>
          <div className="audit-snapshot-card__section">
            <h4 className="audit-snapshot-card__section-title">Details</h4>
            <dl className="audit-snapshot-card__detail-list">
              {Object.entries(audit.details).map(([key, value]) => (
                <div key={key} className="audit-snapshot-card__detail-item">
                  <dt className="audit-snapshot-card__detail-key">{key}</dt>
                  <dd className="audit-snapshot-card__detail-value">
                    {typeof value === "object" ? JSON.stringify(value) : String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </article>
  );
};

AuditSnapshotCard.displayName = "AuditSnapshotCard";

export default AuditSnapshotCard;
