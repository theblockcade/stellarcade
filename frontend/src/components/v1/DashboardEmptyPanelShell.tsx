import React from "react";
import "./DashboardEmptyPanelShell.css";

export interface DashboardEmptyPanelShellProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  testId?: string;
}

export const DashboardEmptyPanelShell: React.FC<DashboardEmptyPanelShellProps> = ({
  title,
  description,
  actionLabel = "Configure module",
  onAction,
  testId = "dashboard-empty-panel-shell",
}) => {
  return (
    <section className="dashboard-empty-panel-shell" data-testid={testId}>
      <div className="dashboard-empty-panel-shell__chip" aria-hidden="true">
        Sparse module
      </div>
      <h3 className="dashboard-empty-panel-shell__title">{title}</h3>
      <p className="dashboard-empty-panel-shell__description">{description}</p>
      <button
        type="button"
        className="dashboard-empty-panel-shell__action"
        onClick={onAction}
      >
        {actionLabel}
      </button>
    </section>
  );
};

export default DashboardEmptyPanelShell;
