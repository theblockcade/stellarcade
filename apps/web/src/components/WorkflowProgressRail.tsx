"use client";

import React, { useCallback, useMemo } from "react";
import "./WorkflowProgressRail.css";

export type WorkflowStepStatus = "pending" | "active" | "completed" | "error" | "blocked";

export interface WorkflowStep {
  id: string;
  label: string;
  description?: string;
  status?: WorkflowStepStatus;
}

export interface WorkflowProgressRailProps {
  steps: WorkflowStep[];
  currentStepIndex?: number;
  onStepClick?: (stepId: string, index: number) => void;
  showLabels?: boolean;
  size?: "compact" | "default";
  orientation?: "horizontal" | "vertical";
  className?: string;
  testId?: string;
}

function resolveStatus(
  step: WorkflowStep,
  index: number,
  currentIndex: number
): WorkflowStepStatus {
  if (step.status !== undefined) return step.status;
  if (index < currentIndex) return "completed";
  if (index === currentIndex) return "active";
  return "pending";
}

const STATUS_LABEL: Record<WorkflowStepStatus, string> = {
  pending: "Pending",
  active: "Current",
  completed: "Completed",
  error: "Error",
  blocked: "Blocked",
};

function StepIcon({
  index,
  status,
}: {
  index: number;
  status: WorkflowStepStatus;
}): React.ReactElement {
  if (status === "completed") {
    return <span aria-hidden="true">✓</span>;
  }
  if (status === "error") {
    return <span aria-hidden="true">✕</span>;
  }
  return <span>{index + 1}</span>;
}

export const WorkflowProgressRail: React.FC<WorkflowProgressRailProps> = ({
  steps,
  currentStepIndex = 0,
  onStepClick,
  showLabels = true,
  size = "default",
  orientation = "horizontal",
  className = "",
  testId = "workflow-progress-rail",
}) => {
  const clampedIndex = useMemo(
    () => Math.max(0, Math.min(currentStepIndex, steps.length - 1)),
    [currentStepIndex, steps.length]
  );

  const resolvedSteps = useMemo(
    () =>
      steps.map((step, index) => ({
        ...step,
        resolvedStatus: resolveStatus(step, index, clampedIndex),
      })),
    [steps, clampedIndex]
  );

  const handleStepClick = useCallback(
    (step: WorkflowStep & { resolvedStatus: WorkflowStepStatus }, index: number) => {
      if (!onStepClick) return;
      if (step.resolvedStatus === "completed" || step.resolvedStatus === "error") {
        onStepClick(step.id, index);
      }
    },
    [onStepClick]
  );

  const containerClass = [
    "wpr",
    `wpr--${size}`,
    `wpr--${orientation}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (steps.length === 0) {
    return (
      <div
        className={containerClass}
        data-testid={`${testId}-empty`}
        role="status"
        aria-label="No workflow steps"
      >
        <span>No steps defined</span>
      </div>
    );
  }

  return (
    <nav
      className={containerClass}
      data-testid={testId}
      aria-label="Workflow progress"
    >
      <ol className="wpr__track" role="list">
        {resolvedSteps.map((step, index) => {
          const { resolvedStatus } = step;
          const isClickable =
            !!onStepClick &&
            (resolvedStatus === "completed" || resolvedStatus === "error");
          const isLast = index === steps.length - 1;

          const itemClass = [
            "wpr__step",
            `wpr__step--${resolvedStatus}`,
            isClickable ? "wpr__step--clickable" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <li
              key={step.id}
              className="wpr__step-item"
              data-testid={`${testId}-step-${index}`}
            >
              <div
                className={itemClass}
                role={isClickable ? "button" : undefined}
                tabIndex={isClickable ? 0 : undefined}
                aria-label={`${step.label}: ${STATUS_LABEL[resolvedStatus]}`}
                aria-current={resolvedStatus === "active" ? "step" : undefined}
                onClick={() => handleStepClick(step, index)}
              >
                <div className="wpr__indicator">
                  <StepIcon index={index} status={resolvedStatus} />
                </div>

                {showLabels && (
                  <div className="wpr__step-content">
                    <span className="wpr__step-label">{step.label}</span>
                  </div>
                )}
              </div>

              {!isLast && (
                <div
                  className={[
                    "wpr__connector",
                    resolvedStatus === "completed"
                      ? "wpr__connector--completed"
                      : resolvedStatus === "active"
                        ? "wpr__connector--active"
                        : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-hidden="true"
                  data-testid={`${testId}-connector-${index}`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default WorkflowProgressRail;
