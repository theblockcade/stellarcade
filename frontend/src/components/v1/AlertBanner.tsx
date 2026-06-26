import React from 'react';
import './AlertBanner.css';

export type AlertBannerVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertBannerAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  testId?: string;
}

export interface AlertBannerProps {
  /** The message/description content of the banner. If not provided or empty, the banner will return null. */
  message?: React.ReactNode;
  /** Severity variant. Default is 'info'. */
  variant?: AlertBannerVariant;
  /** Optional title of the alert banner. */
  title?: string;
  /** Optional single action helper. */
  action?: AlertBannerAction;
  /** Optional multiple actions array. */
  actions?: AlertBannerAction[];
  /** Callback for close/dismiss button. When provided, renders a close button. */
  onDismiss?: () => void;
  /** Optional custom icon override. If not provided, a default icon is used based on the variant. */
  icon?: React.ReactNode;
  /** Whether the banner is in a loading state (renders loading skeletons). */
  isLoading?: boolean;
  /** Whether all interactive controls in the banner are disabled. */
  isDisabled?: boolean;
  /** The CSS positioning behavior. Default is 'inline'. */
  position?: 'inline' | 'sticky-top' | 'sticky-bottom';
  className?: string;
  testId?: string;
}

export function AlertBanner({
  message,
  variant = 'info',
  title,
  action,
  actions = [],
  onDismiss,
  icon,
  isLoading = false,
  isDisabled = false,
  position = 'inline',
  className = '',
  testId = 'alert-banner',
}: AlertBannerProps): React.JSX.Element | null {
  // If no message is provided and not in loading state, render nothing (safe fallback/missing data check)
  if (!message && !isLoading) {
    return null;
  }

  const roleAttr = variant === 'error' || variant === 'warning' ? 'alert' : 'status';
  const ariaLiveAttr = variant === 'error' || variant === 'warning' ? 'assertive' : 'polite';

  // Combine single action and multiple actions
  const allActions = [...actions];
  if (action) {
    allActions.unshift(action);
  }

  return (
    <div
      className={`alert-banner alert-banner--${variant} alert-banner--${position} ${
        isLoading ? 'alert-banner--loading' : ''
      } ${className}`.trim()}
      data-testid={testId}
      role={roleAttr}
      aria-live={ariaLiveAttr}
    >
      <div className="alert-banner__container">
        {/* Left Icon Area */}
        <div className="alert-banner__icon-area" aria-hidden="true">
          {isLoading ? (
            <div className="alert-banner__skeleton-icon animate-pulse" />
          ) : (
            icon || <DefaultIcon variant={variant} />
          )}
        </div>

        {/* Content Area (Title + Message) */}
        <div className="alert-banner__content">
          {isLoading ? (
            <div className="alert-banner__skeleton-text animate-pulse">
              <div className="alert-banner__skeleton-line alert-banner__skeleton-line--title" />
              <div className="alert-banner__skeleton-line alert-banner__skeleton-line--body" />
            </div>
          ) : (
            <>
              {title && <h4 className="alert-banner__title" data-testid={`${testId}-title`}>{title}</h4>}
              <div className="alert-banner__message" data-testid={`${testId}-message`}>
                {message}
              </div>
            </>
          )}
        </div>

        {/* Controls Area (Actions + Dismiss button) */}
        {(allActions.length > 0 || onDismiss || isLoading) && (
          <div className="alert-banner__controls">
            {isLoading ? (
              <div className="alert-banner__skeleton-actions animate-pulse">
                <div className="alert-banner__skeleton-btn" />
              </div>
            ) : (
              <>
                {allActions.map((act, index) => {
                  const isBtnDisabled = isDisabled || act.disabled || act.loading;
                  return (
                    <button
                      key={`${act.label}-${index}`}
                      type="button"
                      onClick={act.onClick}
                      disabled={isBtnDisabled}
                      className={`alert-banner__action-btn ${
                        act.loading ? 'alert-banner__action-btn--loading' : ''
                      }`}
                      data-testid={act.testId ?? `${testId}-action-${index}`}
                    >
                      {act.loading && (
                        <svg
                          className="alert-banner__spinner"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      )}
                      <span className="alert-banner__btn-label">{act.label}</span>
                    </button>
                  );
                })}

                {onDismiss && (
                  <button
                    type="button"
                    onClick={onDismiss}
                    disabled={isDisabled}
                    aria-label="Dismiss alert"
                    className="alert-banner__dismiss-btn"
                    data-testid={`${testId}-dismiss`}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DefaultIcon({ variant }: { variant: AlertBannerVariant }): React.JSX.Element {
  switch (variant) {
    case 'info':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
    case 'success':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    case 'warning':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case 'error':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      );
  }
}

export default AlertBanner;
