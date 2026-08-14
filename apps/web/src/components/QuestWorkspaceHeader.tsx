"use client";

import React from "react";
import type { QuestWorkspaceHeaderProps } from "../types/quest";
import { QuestProgressRing } from "./QuestProgressRing";
import "./QuestWorkspaceHeader.css";

export const QuestWorkspaceHeader: React.FC<QuestWorkspaceHeaderProps> = ({
  activeQuest,
  progress,
  onClaimCertificate,
  onBack,
}) => {
  const isComplete = progress?.isComplete ?? false;
  const percentage = progress?.percentage ?? 0;

  const ringLabel = isComplete
    ? "Quest Complete!"
    : progress
    ? `${progress.completedMilestones}/${progress.totalMilestones} Milestones`
    : "Not Enrolled";

  const ringSubtitle = isComplete
    ? "Ready to claim your certificate"
    : `${Math.round(percentage)}% complete`;

  return (
    <div className="quest-workspace-header" data-testid="quest-workspace-header">
      {onBack && (
        <button
          className="quest-workspace-header__back"
          onClick={onBack}
          data-testid="quest-workspace-back-btn"
          type="button"
          aria-label="Go back to quests"
        >
          <span className="quest-workspace-header__back-icon" aria-hidden="true">
            ←
          </span>
          <span>Back to Quests</span>
        </button>
      )}

      <div className="quest-workspace-header__content">
        <div className="quest-workspace-header__info">
          {activeQuest?.category && (
            <div className="quest-workspace-header__category">{activeQuest.category}</div>
          )}
          <h1 className="quest-workspace-header__title">
            {activeQuest?.title ?? "Quest Workspace"}
          </h1>
          {activeQuest?.description && (
            <p className="quest-workspace-header__description">{activeQuest.description}</p>
          )}
        </div>

        <div className="quest-workspace-header__progress">
          <QuestProgressRing
            percentage={percentage}
            size="large"
            color={isComplete ? "success" : "primary"}
            showPercentage={true}
            animate={true}
            label={ringLabel}
            subtitle={ringSubtitle}
          />
        </div>
      </div>

      {isComplete && (
        <div
          className="quest-workspace-header__cta"
          role="region"
          aria-label="Certificate claim"
          data-testid="quest-workspace-claim-cta"
        >
          <div className="quest-workspace-header__cta-content">
            <span className="quest-workspace-header__cta-icon" aria-hidden="true">
              🏆
            </span>
            <div className="quest-workspace-header__cta-text">
              <span className="quest-workspace-header__cta-title">
                100% Complete - Claim your certificate
              </span>
              <span className="quest-workspace-header__cta-subtitle">
                {"Congratulations! You've completed all milestones."}
              </span>
            </div>
          </div>
          <button
            className="quest-workspace-header__btn quest-workspace-header__btn--claim"
            onClick={onClaimCertificate}
            disabled={!onClaimCertificate}
            data-testid="quest-workspace-claim-btn"
            type="button"
          >
            Claim Certificate
          </button>
        </div>
      )}
    </div>
  );
};

QuestWorkspaceHeader.displayName = "QuestWorkspaceHeader";

export default QuestWorkspaceHeader;
