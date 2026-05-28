import React from "react";

export interface RecoverableErrorAction {
  label: string;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
}

export interface RecoverableErrorPanelProps {
  title: string;
  message: string;
  description?: string;
  onRetry?: () => void | Promise<void>;
  retryLabel?: string;
  retryDisabled?: boolean;
  secondaryAction?: RecoverableErrorAction;
  testId?: string;
}

export function RecoverableErrorPanel({
  title,
  message,
  description,
  onRetry,
  retryLabel = "Retry",
  retryDisabled = false,
  secondaryAction,
  testId = "recoverable-error-panel",
}: RecoverableErrorPanelProps): React.JSX.Element {
  return (
    <section
      className="recoverable-error-panel"
      role="alert"
      aria-live="polite"
      data-testid={testId}
    >
      <div className="recoverable-error-panel__copy">
        <p className="recoverable-error-panel__eyebrow">Recoverable issue</p>
        <h2 className="recoverable-error-panel__title">{title}</h2>
        <p className="recoverable-error-panel__message">{message}</p>
        {description ? (
          <p className="recoverable-error-panel__description">{description}</p>
        ) : null}
      </div>

      <div className="recoverable-error-panel__actions">
        {onRetry ? (
          <button
            type="button"
            className="btn-primary recoverable-error-panel__button"
            onClick={onRetry}
            disabled={retryDisabled}
            data-testid={`${testId}-retry`}
          >
            {retryLabel}
          </button>
        ) : null}
        {secondaryAction ? (
          <button
            type="button"
            className="btn-secondary recoverable-error-panel__button"
            onClick={secondaryAction.onClick}
            disabled={secondaryAction.disabled}
            data-testid={`${testId}-secondary`}
          >
            {secondaryAction.label}
          </button>
        ) : null}
      </div>
    </section>
  );
}

export default RecoverableErrorPanel;
