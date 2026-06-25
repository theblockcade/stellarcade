import React from 'react';
import './RequestErrorStateBlock.css';

/**
 * RequestErrorStateBlock — reusable error state for failed requests (#939).
 *
 * Presentational block for API / fetch failures inside feeds, panels, and
 * tables. Callers pass the error and optional retry handler; the component
 * handles idle (hidden), retrying, disabled, and missing-message fallbacks.
 */

export interface RequestErrorSecondaryAction {
  label: string;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
}

export interface RequestErrorStateBlockProps {
  /** Explicit error flag; also inferred when `error` is provided. */
  hasError?: boolean;
  /** Error payload from a failed request. */
  error?: Error | string | null;
  /** Optional HTTP status code for display. */
  statusCode?: number;
  /** Resource label used in default copy, e.g. "Wallet balance". */
  requestLabel?: string;
  /** Heading override. @default "Request failed" */
  title?: string;
  /** Primary message override. */
  message?: string;
  /** Supporting description shown below the message. */
  description?: string;
  /** When true, shows a retry-in-progress indicator and disables retry. */
  isRetrying?: boolean;
  /** Blocks retry interactions while keeping the error visible. */
  disabled?: boolean;
  onRetry?: () => void | Promise<void>;
  retryLabel?: string;
  secondaryAction?: RequestErrorSecondaryAction;
  className?: string;
  testId?: string;
}

const DEFAULT_TITLE = 'Request failed';
const DEFAULT_MESSAGE = 'Something went wrong while loading data. Please try again.';
const DEFAULT_RETRY_LABEL = 'Try again';
const DEFAULT_RETRYING_LABEL = 'Retrying…';

function hasActiveError(
  hasError: boolean | undefined,
  error: Error | string | null | undefined,
): boolean {
  if (hasError) {
    return true;
  }
  if (error == null) {
    return false;
  }
  if (typeof error === 'string') {
    return error.trim().length > 0;
  }
  return true;
}

function resolveMessage(
  error: Error | string | null | undefined,
  message: string | undefined,
  requestLabel: string | undefined,
): string {
  const trimmedMessage = message?.trim();
  if (trimmedMessage) {
    return trimmedMessage;
  }

  if (typeof error === 'string' && error.trim()) {
    return error.trim();
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  const label = requestLabel?.trim();
  if (label) {
    return `Could not load ${label}.`;
  }

  return DEFAULT_MESSAGE;
}

export const RequestErrorStateBlock: React.FC<RequestErrorStateBlockProps> = ({
  hasError,
  error = null,
  statusCode,
  requestLabel,
  title = DEFAULT_TITLE,
  message,
  description,
  isRetrying = false,
  disabled = false,
  onRetry,
  retryLabel = DEFAULT_RETRY_LABEL,
  secondaryAction,
  className = '',
  testId = 'request-error-state-block',
}) => {
  if (!hasActiveError(hasError, error)) {
    return null;
  }

  const resolvedMessage = resolveMessage(error, message, requestLabel);
  const showRetry = typeof onRetry === 'function';
  const retryDisabled = disabled || isRetrying;
  const blockClassName = [
    'request-error-state-block',
    disabled ? 'request-error-state-block--disabled' : '',
    isRetrying ? 'request-error-state-block--retrying' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section
      className={blockClassName}
      role="alert"
      aria-live="assertive"
      aria-busy={isRetrying || undefined}
      aria-disabled={disabled || undefined}
      data-testid={testId}
      data-state={isRetrying ? 'retrying' : disabled ? 'disabled' : 'error'}
    >
      <div className="request-error-state-block__header">
        <h3 className="request-error-state-block__title">{title}</h3>
        {typeof statusCode === 'number' && !Number.isNaN(statusCode) && (
          <span
            className="request-error-state-block__code"
            data-testid={`${testId}-status-code`}
          >
            {statusCode}
          </span>
        )}
      </div>

      <p className="request-error-state-block__message" data-testid={`${testId}-message`}>
        {resolvedMessage}
      </p>

      {description && (
        <p className="request-error-state-block__description">{description}</p>
      )}

      {isRetrying && (
        <p
          className="request-error-state-block__retrying"
          role="status"
          aria-live="polite"
          data-testid={`${testId}-retrying`}
        >
          {DEFAULT_RETRYING_LABEL}
        </p>
      )}

      {(showRetry || secondaryAction) && (
        <div className="request-error-state-block__actions">
          {showRetry && (
            <button
              type="button"
              className="request-error-state-block__button request-error-state-block__button--primary"
              onClick={onRetry}
              disabled={retryDisabled}
              data-testid={`${testId}-retry`}
              aria-label={isRetrying ? DEFAULT_RETRYING_LABEL : retryLabel}
            >
              {isRetrying ? DEFAULT_RETRYING_LABEL : retryLabel}
            </button>
          )}
          {secondaryAction && (
            <button
              type="button"
              className="request-error-state-block__button request-error-state-block__button--secondary"
              onClick={secondaryAction.onClick}
              disabled={disabled || secondaryAction.disabled}
              data-testid={`${testId}-secondary`}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </section>
  );
};

RequestErrorStateBlock.displayName = 'RequestErrorStateBlock';

export default RequestErrorStateBlock;
