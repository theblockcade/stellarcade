"use client";

import React from "react";
import "./InterruptedFlowPrompt.css";

export interface InterruptedFlowAction {
  label: string;
  onClick: () => void | Promise<void>;
  variant?: "resume" | "discard";
  disabled?: boolean;
  testId?: string;
}

export interface InterruptedFlowPromptProps {
  actionLabel: string;
  description?: string;
  actions?: InterruptedFlowAction[];
  onDismiss?: () => void;
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
