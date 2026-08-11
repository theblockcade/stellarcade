"use client";

import React from "react";
import "./InlineEmptyStateSlot.css";

export interface InlineEmptyStateSlotAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  testId?: string;
}

export interface InlineEmptyStateSlotProps {
  icon?: React.ReactNode;
  message: string;
  description?: string;
  action?: InlineEmptyStateSlotAction;
  size?: "compact" | "default";
  className?: string;
  testId?: string;
}

export const InlineEmptyStateSlot: React.FC<InlineEmptyStateSlotProps> = ({
  icon,
  message,
  description,
  action,
  size = "default",
  className = "",
  testId = "inline-empty-state-slot",
}) => {
  const containerClasses = [
    "inline-empty-state-slot",
    `inline-empty-state-slot--${size}`,
    className,
  ].filter(Boolean).join(" ");

  return (
    <div
      className={containerClasses}
      data-testid={testId}
      role="status"
      aria-live="polite"
    >
      {icon && (
        <div className="inline-empty-state-slot__icon" aria-hidden="true">
          {typeof icon === "string" ? (
            <span className="inline-empty-state-slot__icon-text">{icon}</span>
          ) : (
            icon
          )}
        </div>
      )}

      <div className="inline-empty-state-slot__content">
        <p className="inline-empty-state-slot__message">{message}</p>

        {description && (
          <p className="inline-empty-state-slot__description">{description}</p>
        )}

        {action && (
          <button
            type="button"
            className={[
              "inline-empty-state-slot__action",
              `inline-empty-state-slot__action--${action.variant || "secondary"}`,
            ].join(" ")}
            onClick={action.onClick}
            disabled={action.disabled}
            data-testid={action.testId || `${testId}-action`}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
};

InlineEmptyStateSlot.displayName = "InlineEmptyStateSlot";
export default InlineEmptyStateSlot;
