import React, { useState } from 'react';
import './AlertStackRegion.css';

export interface AlertAction {
  id: string;
  label: string;
  variant?: 'primary' | 'secondary';
}

export interface AlertItem {
  id: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  dismissible?: boolean;
  actions?: AlertAction[];
  timestamp?: number;
  source?: string;
}

export interface AlertStackRegionProps {
  alerts: AlertItem[];
  onDismiss?: (alertId: string) => void;
  onAction?: (alertId: string, actionId: string) => void;
  maxVisible?: number;
  position?: 'inline' | 'sticky-top' | 'sticky-bottom';
  className?: string;
  testId?: string;
}

const SEVERITY_LABELS: Record<AlertItem['severity'], string> = {
  info: 'Info',
  success: 'Success',
  warning: 'Warning',
  error: 'Error',
};

export const AlertStackRegion: React.FC<AlertStackRegionProps> = ({
  alerts,
  onDismiss,
  onAction,
  maxVisible = 5,
  position = 'inline',
  className = '',
  testId = 'alert-stack-region',
}) => {
  const [expanded, setExpanded] = useState(false);

  if (alerts.length === 0) {
    return null;
  }

  const visibleAlerts = expanded ? alerts : alerts.slice(0, maxVisible);
  const hiddenCount = alerts.length - maxVisible;

  const containerClasses = [
    'alert-stack',
    `alert-stack--${position}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={containerClasses}
      data-testid={testId}
      aria-label="Notifications"
      aria-live="polite"
    >
      {visibleAlerts.map((alert) => {
        const roleAttr = alert.severity === 'error' || alert.severity === 'warning' ? 'alert' : 'status';
        const titleText = alert.title || SEVERITY_LABELS[alert.severity];

        return (
          <div
            key={alert.id}
            className={`alert-stack__item alert-stack__item--${alert.severity}`}
            data-testid={`${testId}-alert-${alert.id}`}
            role={roleAttr}
            aria-label={`${alert.severity}: ${titleText}`}
          >
            <div className="alert-stack__content">
              <div className="alert-stack__header">
                <span className="alert-stack__title">{titleText}</span>
                {alert.source && (
                  <span className="alert-stack__source">{alert.source}</span>
                )}
              </div>
              <p className="alert-stack__message">{alert.message}</p>
              {alert.actions && alert.actions.length > 0 && (
                <div className="alert-stack__actions">
                  {alert.actions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      className={`alert-stack__action alert-stack__action--${action.variant || 'secondary'}`}
                      onClick={() => onAction?.(alert.id, action.id)}
                      data-testid={`${testId}-action-${action.id}`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {(alert.dismissible !== false) && onDismiss && (
              <button
                type="button"
                className="alert-stack__dismiss"
                onClick={() => onDismiss(alert.id)}
                aria-label={`Dismiss ${titleText} alert`}
                data-testid={`${testId}-dismiss-${alert.id}`}
              >
                <span aria-hidden="true">&times;</span>
              </button>
            )}
          </div>
        );
      })}

      {!expanded && hiddenCount > 0 && (
        <button
          type="button"
          className="alert-stack__expander"
          onClick={() => setExpanded(true)}
          data-testid={`${testId}-expander`}
        >
          {hiddenCount} more alert{hiddenCount !== 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
};

AlertStackRegion.displayName = 'AlertStackRegion';

export default AlertStackRegion;
