import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PlayerLevelBadgeProps, PlayerTier, PlayerLevelBadgeSize } from './types';
import './PlayerLevelBadge.css';

const SIZE_PX: Record<PlayerLevelBadgeSize, number> = {
  sm: 56,
  md: 80,
  lg: 112,
};

const TIER_COLOR: Record<PlayerTier, string> = {
  Bronze: '#cd7f32',
  Silver: '#c0c0c0',
  Gold: '#ffd700',
  Diamond: '#7dd3fc',
};

/** Tier for a level, per bracket: 1-10 Bronze, 11-25 Silver, 26-50 Gold, 50+ Diamond. */
export const getTierForLevel = (level: number): PlayerTier => {
  if (level > 50) return 'Diamond';
  if (level >= 26) return 'Gold';
  if (level >= 11) return 'Silver';
  return 'Bronze';
};

/** Progress toward the next level, as a fraction in [0, 1]. Clamped to guard against malformed inputs (e.g. next <= current). */
export const calculateTierProgress = (
  currentXp: number,
  xpForCurrentLevel: number,
  xpForNextLevel: number
): number => {
  const span = xpForNextLevel - xpForCurrentLevel;
  if (span <= 0) return 0;
  const progressed = currentXp - xpForCurrentLevel;
  return Math.min(1, Math.max(0, progressed / span));
};

export const PlayerLevelBadge: React.FC<PlayerLevelBadgeProps> = ({
  currentXp,
  xpForCurrentLevel,
  xpForNextLevel,
  level,
  size = 'md',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const prevProgressRef = useRef<number | null>(null);

  const progress = calculateTierProgress(currentXp, xpForCurrentLevel, xpForNextLevel);
  const tier = getTierForLevel(level);
  const pxSize = SIZE_PX[size];
  const radius = pxSize / 2 - 6;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);
  const xpRemaining = Math.max(0, xpForNextLevel - currentXp);

  useEffect(() => {
    if (prevProgressRef.current !== null && prevProgressRef.current < 1 && progress >= 1) {
      setCelebrate(true);
      const timer = setTimeout(() => setCelebrate(false), 900);
      return () => clearTimeout(timer);
    }
    prevProgressRef.current = progress;
  }, [progress]);

  const tooltipText = useMemo(
    () =>
      `Current XP: ${currentXp.toLocaleString()} / ${xpForNextLevel.toLocaleString()} XP (${xpRemaining.toLocaleString()} XP to Level ${level + 1})`,
    [currentXp, xpForNextLevel, xpRemaining, level]
  );

  return (
    <div
      className={`plb-container plb-${size}${celebrate ? ' plb-celebrate' : ''}`}
      style={{ width: pxSize, height: pxSize }}
      role="img"
      aria-label={`Level ${level}, ${tier} tier, ${Math.round(progress * 100)}% progress to next level`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      tabIndex={0}
    >
      <svg width={pxSize} height={pxSize} viewBox={`0 0 ${pxSize} ${pxSize}`}>
        <circle
          cx={pxSize / 2}
          cy={pxSize / 2}
          r={radius}
          fill="none"
          stroke="#2a2b33"
          strokeWidth={5}
        />
        <circle
          cx={pxSize / 2}
          cy={pxSize / 2}
          r={radius}
          fill="none"
          stroke={TIER_COLOR[tier]}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${pxSize / 2} ${pxSize / 2})`}
          className="plb-arc"
        />
      </svg>

      <div className="plb-center" style={{ borderColor: TIER_COLOR[tier] }}>
        <span className="plb-level">{level}</span>
        <span className="plb-tier-icon" aria-hidden="true">
          {tierIcon(tier)}
        </span>
      </div>

      {showTooltip && (
        <div className="plb-tooltip" role="tooltip">
          {tooltipText}
        </div>
      )}
    </div>
  );
};

function tierIcon(tier: PlayerTier): string {
  switch (tier) {
    case 'Bronze':
      return '🥉';
    case 'Silver':
      return '🥈';
    case 'Gold':
      return '🥇';
    case 'Diamond':
      return '💎';
  }
}

export default PlayerLevelBadge;
