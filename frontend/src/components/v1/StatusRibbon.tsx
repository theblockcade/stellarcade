import React from 'react';
import './StatusRibbon.css';

export type StatusVariant = 'active' | 'pending' | 'inactive' | 'error' | 'success';

export interface StatusRibbonProps {
  status: StatusVariant;
  label?: string;
  pulse?: boolean;
  className?: string;
  testId?: string;
}

const STATUS_CONFIG: Record<StatusVariant, { color: string; defaultLabel: string }> = {
  active: { color: '#22c55e', defaultLabel: 'Active' },
  pending: { color: '#f59e0b', defaultLabel: 'Pending' },
  inactive: { color: '#64748b', defaultLabel: 'Inactive' },
  error: { color: '#ef4444', defaultLabel: 'Error' },
  success: { color: '#10b981', defaultLabel: 'Success' },
};

export const StatusRibbon: React.FC<StatusRibbonProps> = ({
  status,
  label,
  pulse = false,
  className = '',
  testId = 'status-ribbon',
}) => {
  const config = STATUS_CONFIG[status];
  const displayLabel = label ?? config.defaultLabel;

  return (
    <span
      className={`status-ribbon status-ribbon--${status} ${pulse ? 'status-ribbon--pulse' : ''} ${className}`}
      data-testid={testId}
      role="status"
      aria-label={`Status: ${displayLabel}`}
      style={{
        '--ribbon-color': config.color,
      } as React.CSSProperties}
    >
      <span className="status-ribbon__dot" aria-hidden="true" />
      <span className="status-ribbon__label">{displayLabel}</span>
    </span>
  );
};

StatusRibbon.displayName = 'StatusRibbon';
export default StatusRibbon;
