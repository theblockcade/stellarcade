import React, { useMemo } from 'react';
import './StatusPill.css';

export type StatusPillTone = 'success' | 'pending' | 'warning' | 'error' | 'neutral';
export type StatusPillSize = 'compact' | 'default';

export interface StatusPillProps {
  tone?: StatusPillTone | string | null;
  label: React.ReactNode;
  icon?: React.ReactNode;
  size?: StatusPillSize;
  className?: string;
  testId?: string;
  ariaLabel?: string;
}

function normalizeTone(tone: StatusPillProps['tone']): StatusPillTone {
  switch (tone) {
    case 'success':
    case 'pending':
    case 'warning':
    case 'error':
    case 'neutral':
      return tone;
    default:
      return 'neutral';
  }
}

export const StatusPill: React.FC<StatusPillProps> = ({
  tone = 'neutral',
  label,
  icon,
  size = 'default',
  className = '',
  testId = 'status-pill',
  ariaLabel,
}) => {
  const resolvedTone = useMemo(() => normalizeTone(tone), [tone]);
  const classes = [
    'status-pill',
    `status-pill--${resolvedTone}`,
    `status-pill--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={classes}
      data-testid={testId}
      data-tone={resolvedTone}
      role="status"
      aria-label={ariaLabel}
    >
      {icon ? (
        <span className="status-pill__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="status-pill__label">{label}</span>
    </span>
  );
};

StatusPill.displayName = 'StatusPill';

export default StatusPill;
