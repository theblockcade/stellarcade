"use client";

import React from "react";
import "./InlineAlertTray.css";

export type AlertTrayVariant = "info" | "success" | "warning" | "error";

export interface InlineAlertTrayAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  testId?: string;
}

export interface InlineAlertTrayProps {
  message: React.ReactNode;
  variant?: AlertTrayVariant;
  icon?: React.ReactNode;
  action?: InlineAlertTrayAction;
  onDismiss?: () => void;
  integration?: "standard" | "flush";
  className?: string;
  testId?: string;
}

export function InlineAlertTray({
  message,
  variant = "info",
  icon,
  action,
  onDismiss,
  integration = "standard",
  className = "",
  testId = "inline-alert-tray",
}: InlineAlertTrayProps): React.JSX.Element {
  const roleAttr = variant === "error" || variant === "warning" ? "alert" : "status";

  return (
    <div
      className={`inline-alert-tray inline-alert-tray--${variant} inline-alert-tray--${integration} ${className}`.trim()}
      data-testid={testId}
      role={roleAttr}
      aria-live="polite"
    >
      <div className="inline-alert-tray__icon">{icon || "ℹ️"}</div>

      <div className="inline-alert-tray__content">{message}</div>

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
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default InlineAlertTray;
