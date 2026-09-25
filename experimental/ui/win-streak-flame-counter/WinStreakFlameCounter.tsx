'use client';

import React from 'react';
import { FlameSize, FlameTier, WinStreakFlameCounterProps } from './types';
import './WinStreakFlameCounter.css';

export function getFlameTier(streakCount: number): FlameTier {
  if (streakCount <= 0) {
    return 'dormant';
  }
  if (streakCount <= 2) {
    return 'spark';
  }
  if (streakCount <= 5) {
    return 'roar';
  }
  return 'inferno';
}

export function formatMultiplier(multiplier: number): string {
  return `${multiplier.toFixed(1)}x`;
}

export function buildAriaLabel(
  streakCount: number,
  multiplier: number,
  showMultiplier: boolean,
): string {
  if (streakCount <= 0) {
    return 'No active win streak. Streak dormant.';
  }
  const wins = `${streakCount} consecutive ${streakCount === 1 ? 'win' : 'wins'}`;
  return showMultiplier
    ? `${wins}, ${formatMultiplier(multiplier)} multiplier bonus`
    : wins;
}

interface FlameParticle {
  x: number;
  y: number;
  r: number;
  delay: number;
  duration: number;
}

const FLAME_PATH =
  'M60 8 C74 28 90 38 90 60 a30 30 0 0 1 -60 0 C30 38 46 28 60 8 Z';

const CORE_PATH =
  'M60 40 C67 52 76 56 76 68 a16 16 0 0 1 -32 0 C44 56 53 52 60 40 Z';

const PARTICLES: Record<FlameTier, FlameParticle[]> = {
  dormant: [],
  spark: [
    { x: 44, y: 22, r: 4, delay: 0, duration: 1.1 },
    { x: 76, y: 26, r: 3, delay: 0.5, duration: 1.3 },
  ],
  roar: [
    { x: 40, y: 20, r: 5, delay: 0, duration: 1.0 },
    { x: 80, y: 22, r: 4, delay: 0.3, duration: 1.2 },
    { x: 60, y: 12, r: 3, delay: 0.6, duration: 0.9 },
    { x: 70, y: 32, r: 3, delay: 0.9, duration: 1.1 },
  ],
  inferno: [
    { x: 34, y: 18, r: 6, delay: 0, duration: 0.9 },
    { x: 86, y: 20, r: 5, delay: 0.2, duration: 1.1 },
    { x: 52, y: 10, r: 4, delay: 0.4, duration: 0.8 },
    { x: 74, y: 10, r: 4, delay: 0.55, duration: 1.0 },
    { x: 44, y: 34, r: 3, delay: 0.7, duration: 1.2 },
    { x: 82, y: 38, r: 3, delay: 0.85, duration: 1.0 },
    { x: 62, y: 4, r: 3, delay: 1.0, duration: 0.85 },
  ],
};

export const WinStreakFlameCounter: React.FC<WinStreakFlameCounterProps> = ({
  streakCount,
  multiplier,
  showMultiplier = true,
  size = 'md',
  className = '',
  testId = 'win-streak-flame-counter',
}) => {
  const tier = getFlameTier(streakCount);
  const particles = PARTICLES[tier];

  return (
    <div
      className={`win-streak-flame-counter win-streak-flame-counter--${size} ${className}`}
      data-testid={testId}
      data-streak={streakCount}
      data-tier={tier}
      role="img"
      aria-label={buildAriaLabel(streakCount, multiplier, showMultiplier)}
    >
      <svg
        className={`win-streak-flame-counter__flame win-streak-flame-counter__flame--${tier}`}
        viewBox="0 0 120 120"
        aria-hidden="true"
        focusable="false"
        data-testid={`${testId}-flame`}
      >
        <path className="win-streak-flame-counter__glow" d={FLAME_PATH} />
        <path className="win-streak-flame-counter__outer" d={FLAME_PATH} />
        <path className="win-streak-flame-counter__inner" d={CORE_PATH} />
        {particles.map((particle, index) => (
          <circle
            key={index}
            className="win-streak-flame-counter__particle"
            cx={particle.x}
            cy={particle.y}
            r={particle.r}
            style={
              {
                '--particle-delay': `${particle.delay}s`,
                '--particle-duration': `${particle.duration}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </svg>

      <div className="win-streak-flame-counter__meta">
        {streakCount > 0 && (
          <span
            key={streakCount}
            className="win-streak-flame-counter__count"
            data-testid={`${testId}-count`}
          >
            {streakCount}
          </span>
        )}
        {showMultiplier && (
          <span className="win-streak-flame-counter__multiplier" data-testid={`${testId}-multiplier`}>
            {formatMultiplier(multiplier)}
          </span>
        )}
      </div>
    </div>
  );
};

WinStreakFlameCounter.displayName = 'WinStreakFlameCounter';
export default WinStreakFlameCounter;