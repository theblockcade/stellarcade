/**
 * RestartFlowPrompt — UI for the abandoned-confirmation-flow detector.
 *
 * Pair with the {@link useRestartFlow} hook: the hook decides whether to
 * surface the prompt; this component renders it. Three actions are
 * offered explicitly rather than nudging the user with a single CTA —
 * "Resume" (continue where they left off), "Restart" (drop the saved
 * progress and begin again), "Dismiss" (close the prompt without
 * deleting the saved progress).
 *
 * Accessibility: rendered as `role="dialog" aria-modal="false"` because
 * the surrounding page is still usable; if the caller wants a true modal
 * they can wrap this with the existing modal-stack primitives. We also
 * attach the dynamic-warning focus hook so the prompt receives focus
 * automatically when it mounts (#787 + #786 deliberately work together).
 */

import React, { useId } from "react";
import { useDynamicWarningFocus } from "../../hooks/v1/useDynamicWarningFocus";
import type { RestartFlowDecision } from "../../hooks/v1/useRestartFlow";
import "./RestartFlowPrompt.css";

export interface RestartFlowPromptProps {
  /** Open state — typically `useRestartFlow().showRestartPrompt`. */
  open: boolean;
  /**
   * Human-readable label for the flow, e.g. "Submit wallet update".
   * Falls back to a generic phrasing.
   */
  flowLabel?: string;
  /** Optional step the flow was at when it was abandoned. */
  lastStepLabel?: string;
  /** Called when the user picks one of the three actions. */
  onDecision: (decision: RestartFlowDecision) => void;
  /** Optional test id passthrough. */
  testId?: string;
}

const RestartFlowPrompt: React.FC<RestartFlowPromptProps> = ({
  open,
  flowLabel,
  lastStepLabel,
  onDecision,
  testId,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  // The hook moves focus to the prompt container the moment it mounts and
  // restores focus when the prompt unmounts — works for both keyboard and
  // screen-reader users.
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
        {flowLabel ? `${flowLabel} ` : "Your last "}was paused
        {lastStepLabel ? ` at "${lastStepLabel}"` : ""}. Resume to keep your
        progress, or restart from the beginning.
      </p>
      <div className="restart-flow-prompt__actions">
        <button
          type="button"
          className="restart-flow-prompt__action restart-flow-prompt__action--primary"
          onClick={() => onDecision("resume")}
        >
          Resume
        </button>
        <button
          type="button"
          className="restart-flow-prompt__action"
          onClick={() => onDecision("restart")}
        >
          Restart
        </button>
        <button
          type="button"
          className="restart-flow-prompt__action restart-flow-prompt__action--ghost"
          onClick={() => onDecision("dismiss")}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default RestartFlowPrompt;
