import React from "react";
import "./StickyActionsFooter.css";

export interface StickyActionsFooterProps {
  children: React.ReactNode;
  className?: string;
  testId?: string;
  steps?: Array<{ id: string; label: string }>;
  currentStepId?: string;
}

export const StickyActionsFooter: React.FC<StickyActionsFooterProps> = ({
  children,
  className = "",
  testId = "sticky-actions-footer",
  steps,
  currentStepId,
}) => {
  const currentStepIndex = steps?.findIndex((step) => step.id === currentStepId) ?? -1;
  const hasStepContext = Boolean(steps?.length && currentStepIndex >= 0);
  const progressValue = hasStepContext ? ((currentStepIndex + 1) / (steps?.length ?? 1)) * 100 : 0;

  return (
    <div
      className={`sticky-actions-footer ${className}`.trim()}
      data-testid={testId}
      role="region"
      aria-label={hasStepContext ? "Workflow actions" : "Page actions"}
    >
      {hasStepContext ? (
        <div className="sticky-actions-footer__progress" data-testid={`${testId}-progress`}>
          <p className="sticky-actions-footer__progress-label">
            Step {currentStepIndex + 1} of {steps?.length}: {steps?.[currentStepIndex]?.label}
          </p>
          <div className="sticky-actions-footer__progress-track" aria-hidden="true">
            <span
              className="sticky-actions-footer__progress-fill"
              style={{ width: `${progressValue}%` }}
            />
          </div>
        </div>
      ) : null}
      <div className="sticky-actions-footer__inner">{children}</div>
    </div>
  );
};

export default StickyActionsFooter;
