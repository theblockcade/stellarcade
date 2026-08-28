import React from 'react';
import { TimerCountdownCircleProps, URGENT_THRESHOLD_SECONDS } from './types';

/** SVG stroke-dashoffset for a circle of radius `r`, given a fraction
 * (0..1) of time remaining. */
export function computeDashOffset(fraction: number, radius: number): number {
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, fraction));
  return circumference * (1 - clamped);
}

export const TimerCountdownCircle: React.FC<TimerCountdownCircleProps> = ({
  secondsRemaining,
  totalSeconds,
}) => {
  const isUrgent = secondsRemaining <= URGENT_THRESHOLD_SECONDS && secondsRemaining > 0;
  const radius = 18;
  const fraction = totalSeconds > 0 ? secondsRemaining / totalSeconds : 0;
  const dashOffset = computeDashOffset(fraction, radius);
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className={`timer-countdown-circle${isUrgent ? ' timer-countdown-circle--urgent' : ''}`}
      data-testid="timer-countdown-circle"
      data-urgent={isUrgent}
    >
      <svg viewBox="0 0 40 40" width="40" height="40">
        <circle className="timer-circle-track" cx="20" cy="20" r={radius} />
        <circle
          className="timer-circle-progress"
          cx="20"
          cy="20"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          data-testid="timer-circle-progress"
        />
      </svg>
      <span className="timer-seconds-label" data-testid="timer-seconds-label">
        {Math.max(0, Math.ceil(secondsRemaining))}
      </span>
    </div>
  );
};
