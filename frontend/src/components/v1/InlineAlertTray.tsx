import React from 'react';
import './InlineAlertTray.css';

export type AlertTrayVariant = 'info' | 'success' | 'warning' | 'error';

export interface InlineAlertTrayAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  testId?: string;
}

export interface InlineAlertTrayProps {
  /** The message or content of the alert */
  message: React.ReactNode;
  /** Severity variant. Default is 'info' */
  variant?: AlertTrayVariant;
  /** Optional icon to override the default variant icon */
  icon?: React.ReactNode;
  /** Optional action button on the right side */
  action?: InlineAlertTrayAction;
  /** If provided, renders a dismiss (X) button */
  onDismiss?: () => void;
  /** Optional container style integration. 'flush' removes horizontal borders/radius */
  integration?: 'standard' | 'flush';
  className?: string;
  testId?: string;
}

export function InlineAlertTray({
  message,
  variant = 'info',
  icon,
  action,
  onDismiss,
  integration = 'standard',
  className = '',
  testId = 'inline-alert-tray',
}: InlineAlertTrayProps): React.JSX.Element {
  const roleAttr = variant === 'error' || variant === 'warning' ? 'alert' : 'status';

  return (
    <div
      className={`inline-alert-tray inline-alert-tray--${variant} inline-alert-tray--${integration} ${className}`.trim()}
      data-testid={testId}
      role={roleAttr}
      aria-live="polite"
    >
      <div className="inline-alert-tray__icon">
        {icon || <DefaultIcon variant={variant} />}
      </div>
      
      <div className="inline-alert-tray__content">
        {message}
      </div>

      {(action || onDismiss) && (
        <div className="inline-alert-tray__controls">
          {action && (
            <button
              type="button"
              className="inline-alert-tray__action-btn"
              onClick={action.onClick}
              disabled={action.disabled}
              data-testid={action.testId ?? `${testId}-action`}
            >
              {action.label}
            </button>
          )}
          
          {onDismiss && (
            <button
              type="button"
              className="inline-alert-tray__dismiss-btn"
              onClick={onDismiss}
              aria-label="Dismiss alert"
              data-testid={`${testId}-dismiss`}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function DefaultIcon({ variant }: { variant: AlertTrayVariant }): React.JSX.Element {
  switch (variant) {
    case 'info':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
    case 'success':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    case 'warning':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case 'error':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      );
  }
}

export default InlineAlertTray;
