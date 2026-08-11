"use client";

import React from "react";
import "./RequestErrorStateBlock.css";

export interface RequestErrorSecondaryAction {
  label: string;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
}

export interface RequestErrorStateBlockProps {
  hasError?: boolean;
  error?: Error | string | null;
  statusCode?: number;
  requestLabel?: string;
  title?: string;
  message?: string;
  description?: string;
  isRetrying?: boolean;
  disabled?: boolean;
  onRetry?: () => void | Promise<void>;
  retryLabel?: string;
  secondaryAction?: RequestErrorSecondaryAction;
  className?: string;
  testId?: string;
}

const DEFAULT_TITLE = "Request failed";
const DEFAULT_MESSAGE = "Something went wrong while loading data. Please try again.";
const DEFAULT_RETRY_LABEL = "Try again";
const DEFAULT_RETRYING_LABEL = "Retrying…";

function hasActiveError(
  hasError: boolean | undefined,
  error: Error | string | null | undefined
): boolean {
  if (hasError) return true;
  if (error == null) return false;
  if (typeof error === "string") return error.trim().length > 0;
  return true;
}

function resolveMessage(
  error: Error | string | null | undefined,
  message: string | undefined,
  requestLabel: string | undefined
): string {
  const trimmedMessage = message?.trim();
  if (trimmedMessage) return trimmedMessage;

  if (typeof error === "string" && error.trim()) return error.trim();
  if (error instanceof Error && error.message.trim()) return error.message.trim();

  const label = requestLabel?.trim();
  if (label) return `Could not load ${label}.`;

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
  className = "",
  testId = "request-error-state-block",
}) => {
  if (!hasActiveError(hasError, error)) {
    return null;
  }

  const resolvedMessage = resolveMessage(error, message, requestLabel);
  const showRetry = typeof onRetry === "function";
  const retryDisabled = disabled || isRetrying;
  const blockClassName = [
    "request-error-state-block",
    disabled ? "request-error-state-block--disabled" : "",
    isRetrying ? "request-error-state-block--retrying" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      className={blockClassName}
      role="alert"
      aria-live="assertive"
      aria-busy={isRetrying || undefined}
      aria-disabled={disabled || undefined}
      data-testid={testId}
      data-state={isRetrying ? "retrying" : disabled ? "disabled" : "error"}
    >
      <div className="request-error-state-block__header">
        <h3 className="request-error-state-block__title">{title}</h3>
        {typeof statusCode === "number" && !Number.isNaN(statusCode) && (
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

RequestErrorStateBlock.displayName = "RequestErrorStateBlock";
export default RequestErrorStateBlock;
