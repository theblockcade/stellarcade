"use client";

import React, { useEffect, useState } from "react";
import type { QuestProgressBarProps } from "../types/quest";
import "./QuestProgressBar.css";

const SIZE_HEIGHT_MAP = {
  small: "4px",
  medium: "8px",
  large: "12px",
};

const DEFAULT_ANIMATION_DURATION = 1000;

export const QuestProgressBar: React.FC<QuestProgressBarProps> = ({
  percentage,
  label,
  animate = true,
  animationDuration = DEFAULT_ANIMATION_DURATION,
  size = "medium",
}) => {
  const [displayPercentage, setDisplayPercentage] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  useEffect(() => {
    if (animate && !hasAnimated) {
      const startTime = Date.now();
      const duration = animationDuration;

      const animateProgress = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);

        setDisplayPercentage(easedProgress * clampedPercentage);

        if (progress < 1) {
          requestAnimationFrame(animateProgress);
        } else {
          setHasAnimated(true);
        }
      };

      requestAnimationFrame(animateProgress);
    } else {
      setDisplayPercentage(clampedPercentage);
    }
  }, [animate, animationDuration, clampedPercentage, hasAnimated]);

  const height = SIZE_HEIGHT_MAP[size];

  return (
    <div className="quest-progress-bar" data-testid="quest-progress-bar">
      <div
        className="quest-progress-bar__track"
        style={{ height }}
        role="progressbar"
        aria-valuenow={Math.round(displayPercentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || "Quest progress"}
      >
        <div
          className="quest-progress-bar__fill"
          style={{
            width: `${displayPercentage}%`,
            height: "100%",
          }}
          data-testid="quest-progress-bar-fill"
        />
      </div>

      {label && (
        <div className="quest-progress-bar__label" data-testid="quest-progress-bar-label">
          {label}
        </div>
      )}
    </div>
  );
};

QuestProgressBar.displayName = "QuestProgressBar";

export default QuestProgressBar;
