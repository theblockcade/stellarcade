import React, { useCallback, useMemo } from 'react';
import './WorkflowProgressRail.css';

export type WorkflowStepStatus = 'pending' | 'active' | 'completed' | 'error' | 'blocked';

export interface WorkflowStep {
  id: string;
  label: string;
  description?: string;
  status?: WorkflowStepStatus;
}

export interface WorkflowProgressRailProps {
  steps: WorkflowStep[];
  /** Zero-based index of the currently active step (ignored when each step carries an explicit status). */
  currentStepIndex?: number;
  /** Called when user clicks a completed or error step to navigate back. */
  onStepClick?: (stepId: string, index: number) => void;
  /** Whether step labels are shown beneath the indicators. */
  showLabels?: boolean;
  size?: 'compact' | 'default';
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  testId?: string;
}

function resolveStatus(
  step: WorkflowStep,
  index: number,
  currentIndex: number,
): WorkflowStepStatus {
  if (step.status !== undefined) return step.status;
  if (index < currentIndex) return 'completed';
  if (index === currentIndex) return 'active';
  return 'pending';
}

const STATUS_LABEL: Record<WorkflowStepStatus, string> = {
  pending: 'Pending',
  active: 'Current',
  completed: 'Completed',
  error: 'Error',
  blocked: 'Blocked',
};

function StepIcon({
  index,
  status,
  size,
}: {
  index: number;
  status: WorkflowStepStatus;
  size: 'compact' | 'default';
}): React.ReactElement {
  if (status === 'completed') {
    return (
      <span className="wpr__step-icon" aria-hidden="true">
        ✓
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="wpr__step-icon" aria-hidden="true">
        ✕
      </span>
    );
  }
  if (status === 'blocked') {
    return (
      <span className="wpr__step-icon" aria-hidden="true">
        ⊘
      </span>
    );
  }
  if (size === 'compact') {
    return <span className="wpr__step-dot" aria-hidden="true" />;
  }
  return <span className="wpr__step-number">{index + 1}</span>;
}

export const WorkflowProgressRail: React.FC<WorkflowProgressRailProps> = ({
  steps,
  currentStepIndex = 0,
  onStepClick,
  showLabels = true,
  size = 'default',
  orientation = 'horizontal',
  className = '',
  testId = 'workflow-progress-rail',
}) => {
  const clampedIndex = useMemo(
    () => Math.max(0, Math.min(currentStepIndex, steps.length - 1)),
    [currentStepIndex, steps.length],
  );

  const resolvedSteps = useMemo(
    () =>
      steps.map((step, index) => ({
        ...step,
        resolvedStatus: resolveStatus(step, index, clampedIndex),
      })),
    [steps, clampedIndex],
  );

  const handleStepClick = useCallback(
    (step: WorkflowStep & { resolvedStatus: WorkflowStepStatus }, index: number) => {
      if (!onStepClick) return;
      if (step.resolvedStatus === 'completed' || step.resolvedStatus === 'error') {
        onStepClick(step.id, index);
      }
    },
    [onStepClick],
  );

  const containerClass = [
    'wpr',
    `wpr--${size}`,
    `wpr--${orientation}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (steps.length === 0) {
    return (
      <div
        className={containerClass}
        data-testid={`${testId}-empty`}
        role="status"
        aria-label="No workflow steps"
      >
        <span className="wpr__empty">No steps defined</span>
      </div>
    );
  }

  const activeStep = resolvedSteps.find((s) => s.resolvedStatus === 'active');
  const activeLabel = activeStep?.label ?? resolvedSteps[clampedIndex]?.label ?? '';

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
            (resolvedStatus === 'completed' || resolvedStatus === 'error');
          const isLast = index === steps.length - 1;

          const itemClass = [
            'wpr__step',
            `wpr__step--${resolvedStatus}`,
            isClickable ? 'wpr__step--clickable' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <li
              key={step.id}
              className="wpr__step-item"
              data-testid={`${testId}-step-${index}`}
            >
              <div
                className={itemClass}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
                aria-label={`${step.label}: ${STATUS_LABEL[resolvedStatus]}`}
                aria-current={resolvedStatus === 'active' ? 'step' : undefined}
                data-step-id={step.id}
                data-step-status={resolvedStatus}
                onClick={() => handleStepClick(step, index)}
                onKeyDown={(e) => {
                  if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleStepClick(step, index);
                  }
                }}
              >
                <div className="wpr__indicator">
                  <StepIcon index={index} status={resolvedStatus} size={size} />
                </div>

                {showLabels && (
                  <div className="wpr__step-content">
                    <span className="wpr__step-label">{step.label}</span>
                    {step.description && size !== 'compact' && (
                      <span className="wpr__step-description">{step.description}</span>
                    )}
                  </div>
                )}
              </div>

              {!isLast && (
                <div
                  className={[
                    'wpr__connector',
                    resolvedStatus === 'completed'
                      ? 'wpr__connector--completed'
                      : resolvedStatus === 'active'
                        ? 'wpr__connector--active'
                        : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-hidden="true"
                  data-testid={`${testId}-connector-${index}`}
                />
              )}
            </li>
          );
        })}
      </ol>

      <div className="wpr__summary" aria-live="polite" data-testid={`${testId}-summary`}>
        <span className="sr-only">
          {`Step ${clampedIndex + 1} of ${steps.length}: ${activeLabel}`}
        </span>
      </div>
    </nav>
  );
};

WorkflowProgressRail.displayName = 'WorkflowProgressRail';

export default WorkflowProgressRail;
