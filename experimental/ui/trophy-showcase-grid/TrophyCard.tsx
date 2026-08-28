import React from "react";
import { TrophyCardProps } from "./types";

export function computeProgressPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export const TrophyCard: React.FC<TrophyCardProps> = ({ trophy, onSelect }) => {
  const isLocked = trophy.status === "locked";
  const isInProgress = trophy.status === "in_progress";
  const progressPercent = trophy.progress
    ? computeProgressPercent(trophy.progress.current, trophy.progress.target)
    : 0;

  return (
    <button
      type="button"
      className={`trophy-card trophy-card--${trophy.rarity} trophy-card--${trophy.status}${
        isLocked ? " trophy-card--grayscale" : ""
      }`}
      onClick={() => onSelect?.(trophy)}
      data-testid={`trophy-card-${trophy.id}`}
      data-status={trophy.status}
      data-rarity={trophy.rarity}
    >
      <h3 className="trophy-card-title">{trophy.title}</h3>

      {isInProgress && trophy.progress && (
        <div className="trophy-progress" data-testid={`trophy-progress-${trophy.id}`}>
          <div
            className="trophy-progress-bar"
            style={{ width: `${progressPercent}%` }}
            data-testid={`trophy-progress-bar-${trophy.id}`}
          />
          <span className="trophy-progress-label" data-testid={`trophy-progress-label-${trophy.id}`}>
            {trophy.progress.current}/{trophy.progress.target}
          </span>
        </div>
      )}

      {trophy.status === "unlocked" && trophy.unlockDate && (
        <span className="trophy-unlock-date" data-testid={`trophy-unlock-date-${trophy.id}`}>
          Unlocked {trophy.unlockDate}
        </span>
      )}
    </button>
  );
};
