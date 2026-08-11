"use client";

import React, { useId } from "react";
import { useDynamicWarningFocus } from "../hooks/useDynamicWarningFocus";
import type { RestartFlowDecision } from "../hooks/useRestartFlow";
import "./RestartFlowPrompt.css";

export interface RestartFlowPromptProps {
  open: boolean;
  flowLabel?: string;
  lastStepLabel?: string;
  onDecision: (decision: RestartFlowDecision) => void;
  testId?: string;
}

export const RestartFlowPrompt: React.FC<RestartFlowPromptProps> = ({
  open,
  flowLabel,
  lastStepLabel,
  onDecision,
  testId = "restart-flow-prompt",
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const containerRef = useDynamicWarningFocus<HTMLDivElement>(open);

  if (!open) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="restart-flow-prompt"
      data-testid={testId}
    >
      <h2 id={titleId} className="restart-flow-prompt__title">
        Resume where you left off?
      </h2>
      <p id={descriptionId} className="restart-flow-prompt__body">
        {flowLabel ? `${flowLabel} ` : "Your last flow "}was paused
        {lastStepLabel ? ` at "${lastStepLabel}"` : ""}. Resume to keep your
        progress, or restart from the beginning.
      </p>
      <div className="restart-flow-prompt__actions">
        <button
          type="button"
          className="restart-flow-prompt__action restart-flow-prompt__action--primary"
          onClick={() => onDecision("resume")}
          data-testid={`${testId}-resume`}
        >
          Resume
        </button>
        <button
          type="button"
          className="restart-flow-prompt__action"
          onClick={() => onDecision("restart")}
          data-testid={`${testId}-restart`}
        >
          Restart
        </button>
        <button
          type="button"
          className="restart-flow-prompt__action restart-flow-prompt__action--ghost"
          onClick={() => onDecision("dismiss")}
          data-testid={`${testId}-dismiss`}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default RestartFlowPrompt;
