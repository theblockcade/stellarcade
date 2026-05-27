import React from "react";
import "./InterruptedFlowPrompt.css";

export interface InterruptedFlowAction {
  /** Button text. */
  label: string;
  onClick: () => void | Promise<void>;
  /** @default 'discard' */
  variant?: "resume" | "discard";
  disabled?: boolean;
  testId?: string;
}

export interface InterruptedFlowPromptProps {
  /**
   * Short human-readable name of the queued action that was interrupted.
   * e.g. "Token swap", "Place bid"
   */
  actionLabel: string;
  /** Optional description shown below the title. */
  description?: string;
  /** Resume / discard / custom action buttons. */
  actions?: InterruptedFlowAction[];
  /** Called when the user dismisses without choosing. Hides dismiss button when omitted. */
  onDismiss?: () => void;
  /** Visually compact variant for inline surfaces. @default false */
  compact?: boolean;
  testId?: string;
  className?: string;
}

export const InterruptedFlowPrompt: React.FC<InterruptedFlowPromptProps> = ({
  actionLabel,
  description,
  actions = [],
  onDismiss,
  compact = false,
  testId = "interrupted-flow-prompt",
  className = "",
}) => {
  const rootClass = [
    "interrupted-flow-prompt",
    compact ? "interrupted-flow-prompt--compact" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <aside
      className={rootClass}
      role="status"
      aria-live="polite"
      data-testid={testId}
    >
      <span
        className="interrupted-flow-prompt__icon"
        aria-hidden="true"
        data-testid={`${testId}-icon`}
      >
        ↩
      </span>

      <div className="interrupted-flow-prompt__body">
        <h3 className="interrupted-flow-prompt__title">
          Resume: {actionLabel}
        </h3>

        {description && (
          <p className="interrupted-flow-prompt__description">{description}</p>
        )}

        {actions.length > 0 && (
          <div
            className="interrupted-flow-prompt__actions"
            data-testid={`${testId}-actions`}
          >
            {actions.map((action, idx) => {
              const btnVariant = action.variant ?? "discard";
              return (
                <button
                  key={`${action.label}-${idx}`}
                  type="button"
                  className={`interrupted-flow-prompt__action interrupted-flow-prompt__action--${btnVariant}`}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  data-testid={action.testId ?? `${testId}-action-${idx}`}
                >
                  {action.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {onDismiss && (
        <button
          type="button"
          className="interrupted-flow-prompt__dismiss"
          onClick={onDismiss}
          aria-label="Dismiss interrupted flow prompt"
          data-testid={`${testId}-dismiss`}
        >
          ×
        </button>
      )}
    </aside>
  );
};

export default InterruptedFlowPrompt;
