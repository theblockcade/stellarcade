import React from "react";
import { Callout, type CalloutVariant } from "./Callout";
import "./InlineAlertCluster.css";

export interface InlineAlertClusterAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  testId?: string;
}

export interface InlineAlertClusterItem {
  id: string;
  title?: string;
  description: React.ReactNode;
  variant?: CalloutVariant;
  action?: InlineAlertClusterAction;
  icon?: React.ReactNode;
}

export interface InlineAlertClusterProps {
  alerts: InlineAlertClusterItem[];
  className?: string;
  testId?: string;
}

export function InlineAlertCluster({
  alerts,
  className = "",
  testId = "inline-alert-cluster",
}: InlineAlertClusterProps): React.JSX.Element | null {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <div
      className={["inline-alert-cluster", className].filter(Boolean).join(" ")}
      data-testid={testId}
      role="list"
      aria-label="Inline alerts"
    >
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="inline-alert-cluster__item"
          role="listitem"
          data-testid={`${testId}-${alert.id}`}
        >
          <Callout
            title={alert.title}
            variant={alert.variant ?? "info"}
            icon={alert.icon}
            testId={`${testId}-${alert.id}-callout`}
          >
            <div className="inline-alert-cluster__body">
              <div>{alert.description}</div>
              {alert.action ? (
                <button
                  type="button"
                  className="inline-alert-cluster__action"
                  onClick={alert.action.onClick}
                  disabled={alert.action.disabled}
                  data-testid={
                    alert.action.testId ?? `${testId}-${alert.id}-action`
                  }
                >
                  {alert.action.label}
                </button>
              ) : null}
            </div>
          </Callout>
        </div>
      ))}
    </div>
  );
}

export default InlineAlertCluster;
