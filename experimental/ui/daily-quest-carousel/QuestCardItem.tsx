'use client';

import React, { useState } from 'react';
import type { QuestCardItemProps } from './types';

const RADIUS = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const QuestCardItem: React.FC<QuestCardItemProps> = ({
  quest,
  onClaim,
  testId = `quest-card-${quest.id}`,
}) => {
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const clampedProgress = Math.min(quest.progress, quest.target);
  const percent = quest.target > 0 ? clampedProgress / quest.target : 0;
  const isComplete = clampedProgress >= quest.target;
  const dashOffset = CIRCUMFERENCE * (1 - percent);

  const handleClaim = async () => {
    if (!isComplete || quest.claimed || isClaiming) {
      return;
    }
    setIsClaiming(true);
    setClaimError(null);
    try {
      await onClaim(quest.id);
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : 'Failed to claim reward');
    } finally {
      setIsClaiming(false);
    }
  };

  const buttonLabel = quest.claimed
    ? 'Claimed'
    : isClaiming
      ? 'Claiming…'
      : isComplete
        ? 'Claim Reward'
        : `${clampedProgress}/${quest.target}`;

  return (
    <div
      className={`quest-card-item quest-card-item--${quest.category} ${
        isComplete && !quest.claimed ? 'quest-card-item--completed' : ''
      } ${quest.claimed ? 'quest-card-item--claimed' : ''}`}
      data-testid={testId}
    >
      <div className="quest-card-item__ring-wrapper">
        <svg
          className="quest-card-item__ring"
          width="56"
          height="56"
          viewBox="0 0 56 56"
          role="img"
          aria-label={`Progress ${clampedProgress} of ${quest.target}`}
        >
          <circle
            className="quest-card-item__ring-track"
            cx="28"
            cy="28"
            r={RADIUS}
            fill="none"
            strokeWidth="4"
          />
          <circle
            className="quest-card-item__ring-fill"
            cx="28"
            cy="28"
            r={RADIUS}
            fill="none"
            strokeWidth="4"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 28 28)"
          />
        </svg>
        <span className="quest-card-item__ring-label">
          {clampedProgress}/{quest.target}
        </span>
      </div>

      <div className="quest-card-item__body">
        <h3 className="quest-card-item__title">{quest.title}</h3>
        <p className="quest-card-item__description">{quest.description}</p>
        <span className="quest-card-item__reward">{quest.reward}</span>
      </div>

      <button
        type="button"
        className={`quest-card-item__claim-btn ${
          isComplete && !quest.claimed ? 'quest-card-item__claim-btn--pulse' : ''
        }`}
        onClick={handleClaim}
        disabled={!isComplete || quest.claimed || isClaiming}
        aria-busy={isClaiming}
        data-testid={`${testId}-claim-button`}
      >
        {buttonLabel}
      </button>

      {claimError && (
        <p className="quest-card-item__error" role="alert" data-testid={`${testId}-error`}>
          {claimError}
        </p>
      )}
    </div>
  );
};

QuestCardItem.displayName = 'QuestCardItem';
export default QuestCardItem;
