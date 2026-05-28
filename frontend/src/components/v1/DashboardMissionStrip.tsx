import React from "react";
import { StatusPill } from "./StatusPill";

export interface DashboardMission {
  id: string;
  title: string;
  description: string;
  complete: boolean;
  actionLabel: string;
  onAction: () => void | Promise<void>;
}

export interface DashboardMissionStripProps {
  missions: DashboardMission[];
  sessionLabel: string;
  onDismiss: () => void;
  testId?: string;
}

export function DashboardMissionStrip({
  missions,
  sessionLabel,
  onDismiss,
  testId = "dashboard-mission-strip",
}: DashboardMissionStripProps): React.JSX.Element {
  const completedCount = missions.filter((mission) => mission.complete).length;

  return (
    <aside
      className="dashboard-mission-strip"
      aria-label="Onboarding mission strip"
      data-testid={testId}
    >
      <div className="dashboard-mission-strip__header">
        <div>
          <p className="dashboard-mission-strip__eyebrow">{sessionLabel}</p>
          <h2 className="dashboard-mission-strip__title">
            Start this dashboard session with a few guided moves
          </h2>
        </div>
        <div className="dashboard-mission-strip__meta">
          <StatusPill
            tone={completedCount === missions.length ? "success" : "info"}
            label={`${completedCount}/${missions.length} done`}
            size="compact"
          />
          <button
            type="button"
            className="dashboard-mission-strip__dismiss"
            onClick={onDismiss}
            aria-label="Dismiss onboarding missions"
            data-testid={`${testId}-dismiss`}
          >
            Dismiss
          </button>
        </div>
      </div>

      <div className="dashboard-mission-strip__grid">
        {missions.map((mission) => (
          <article
            key={mission.id}
            className="dashboard-mission-strip__card"
            data-testid={`${testId}-${mission.id}`}
          >
            <div className="dashboard-mission-strip__card-header">
              <StatusPill
                tone={mission.complete ? "success" : "warning"}
                label={mission.complete ? "Complete" : "In progress"}
                size="compact"
              />
              <span className="dashboard-mission-strip__card-step">
                {mission.id.replace(/-/g, " ")}
              </span>
            </div>
            <h3>{mission.title}</h3>
            <p>{mission.description}</p>
            <button
              type="button"
              className="btn-secondary dashboard-mission-strip__action"
              onClick={mission.onAction}
            >
              {mission.actionLabel}
            </button>
          </article>
        ))}
      </div>
    </aside>
  );
}

export default DashboardMissionStrip;
