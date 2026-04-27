import React from "react";
import "./CautionStatePanel.css";

/**
 * Caution state panel — issue #682.
 *
 * Shared component for "your wallet is blocked / your contract is paused /
 * the network changed under you / you've been rate-limited" — the four
 * recoverable, action-required states the dashboard surfaces hit. Each
 * variant carries its own colour ramp; the action / dismiss behaviour is
 * controlled by the caller.
 *
 * Use this anywhere a single banner needs to describe a blocked wallet or
 * contract action and offer the recovery step. Variant-specific copy lives
 * in the caller, since the wording depends on the surface (settings vs.
 * dashboard vs. play page).
 */
export type CautionVariant =
  | "blocked-wallet"
  | "paused-contract"
  | "network-mismatch"
  | "rate-limited";

const VARIANT_ICON_LABELS: Record<CautionVariant, string> = {
  "blocked-wallet": "!",
  "paused-contract": "‖",
  "network-mismatch": "↻",
  "rate-limited": "◔",
};

export interface CautionStatePanelAction {
  label: string;
  onAction: () => void | Promise<void>;
  /** Primary actions render with a filled background; secondary stay outlined. */
  variant?: "primary" | "secondary";
  testId?: string;
}

export interface CautionStatePanelProps {
  variant: CautionVariant;
  title: string;
  description: React.ReactNode;
  actions?: CautionStatePanelAction[];
  /** Optional dismiss handler — when omitted, the close button is hidden. */
  onDismiss?: () => void;
  /** Optional override for the variant icon character. */
  icon?: React.ReactNode;
  testId?: string;
  className?: string;
}

export const CautionStatePanel: React.FC<CautionStatePanelProps> = ({
  variant,
  title,
  description,
  actions = [],
  onDismiss,
  icon,
  testId = "caution-state-panel",
  className = "",
}) => {
  const variantClass = `caution-state-panel--${variant}`;
  const rootClass =
    `caution-state-panel ${variantClass}${className ? ` ${className}` : ""}`.trim();

  return (
    <section
      className={rootClass}
      role="alert"
      data-testid={testId}
      data-variant={variant}
    >
      <span
        className="caution-state-panel__icon"
        aria-hidden="true"
        data-testid={`${testId}-icon`}
      >
        {icon ?? VARIANT_ICON_LABELS[variant]}
      </span>
      <div className="caution-state-panel__body">
        <h3 className="caution-state-panel__title">{title}</h3>
        <p className="caution-state-panel__description">{description}</p>
        {actions.length > 0 && (
          <div
            className="caution-state-panel__actions"
            data-testid={`${testId}-actions`}
          >
            {actions.map((action, idx) => (
              <button
                key={`${action.label}-${idx}`}
                type="button"
                className={
                  action.variant === "primary"
                    ? "caution-state-panel__action caution-state-panel__action--primary"
                    : "caution-state-panel__action"
                }
                onClick={action.onAction}
                data-testid={action.testId ?? `${testId}-action-${idx}`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          className="caution-state-panel__dismiss"
          onClick={onDismiss}
          aria-label="Dismiss caution panel"
          data-testid={`${testId}-dismiss`}
        >
          ×
        </button>
      )}
    </section>
  );
};

export default CautionStatePanel;
