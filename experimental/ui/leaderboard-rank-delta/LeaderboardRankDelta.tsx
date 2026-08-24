'use client';

import React, { useState, useMemo } from 'react';
import { LeaderboardRankDeltaProps, DeltaInfo } from './types';
import './LeaderboardRankDelta.css';

const calculateDelta = (current: number, previous: number | null): DeltaInfo => {
  if (previous === null) {
    return { delta: 0, direction: 'neutral', isNewEntry: true, isTopThree: current <= 3 };
  }

  const delta = previous - current;
  const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral';
  
  return {
    delta: Math.abs(delta),
    direction,
    isNewEntry: false,
    isTopThree: current <= 3,
  };
};

export const LeaderboardRankDelta: React.FC<LeaderboardRankDeltaProps> = ({
  currentRank,
  previousRank,
  history = [],
  size = 'md',
  className = '',
  testId = 'leaderboard-rank-delta',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const deltaInfo = useMemo(() => 
    calculateDelta(currentRank, previousRank), 
    [currentRank, previousRank]
  );

  const getAriaLabel = (): string => {
    if (deltaInfo.isNewEntry) {
      return `New entry at rank ${currentRank}`;
    }
    
    if (deltaInfo.direction === 'up') {
      return `Rank increased by ${deltaInfo.delta} positions to ${currentRank}`;
    }
    
    if (deltaInfo.direction === 'down') {
      return `Rank decreased by ${deltaInfo.delta} positions to ${currentRank}`;
    }
    
    return `Rank unchanged at ${currentRank}`;
  };

  const renderBadge = () => {
    if (deltaInfo.isNewEntry) {
      return (
        <span className="leaderboard-rank-delta__new-entry">NEW</span>
      );
    }

    if (deltaInfo.direction === 'neutral') {
      return <span className="leaderboard-rank-delta__neutral">−</span>;
    }

    const arrow = deltaInfo.direction === 'up' ? '↑' : '↓';
    const sign = deltaInfo.direction === 'up' ? '+' : '-';
    
    return (
      <span className={`leaderboard-rank-delta__${deltaInfo.direction}`}>
        {arrow} {sign}{deltaInfo.delta}
      </span>
    );
  };

  const renderTooltip = () => {
    if (!showTooltip || !history || history.length === 0) {
      return null;
    }

    const recentHistory = history.slice(-7);
    const maxRank = Math.max(...recentHistory.map(h => h.rank));
    const minRank = Math.min(...recentHistory.map(h => h.rank));
    const avgRank = Math.round(recentHistory.reduce((sum, h) => sum + h.rank, 0) / recentHistory.length);

    return (
      <div className="leaderboard-rank-delta__tooltip">
        <div className="leaderboard-rank-delta__tooltip-header">
          <span className="leaderboard-rank-delta__tooltip-title">7-Day History</span>
        </div>
        <div className="leaderboard-rank-delta__tooltip-stats">
          <div className="leaderboard-rank-delta__tooltip-stat">
            <span className="leaderboard-rank-delta__tooltip-label">Best:</span>
            <span className="leaderboard-rank-delta__tooltip-value">#{minRank}</span>
          </div>
          <div className="leaderboard-rank-delta__tooltip-stat">
            <span className="leaderboard-rank-delta__tooltip-label">Current:</span>
            <span className="leaderboard-rank-delta__tooltip-value">#{currentRank}</span>
          </div>
          <div className="leaderboard-rank-delta__tooltip-stat">
            <span className="leaderboard-rank-delta__tooltip-label">Average:</span>
            <span className="leaderboard-rank-delta__tooltip-value">#{avgRank}</span>
          </div>
        </div>
        <div className="leaderboard-rank-delta__tooltip-chart">
          {recentHistory.map((point, index) => {
            const height = 100 - ((point.rank - minRank) / (maxRank - minRank || 1)) * 80;
            return (
              <div
                key={index}
                className="leaderboard-rank-delta__tooltip-bar"
                style={{
                  height: `${Math.max(20, height)}%`,
                  backgroundColor: point.rank === currentRank ? '#22c55e' : '#6b7280',
                }}
                title={`#${point.rank} on ${point.date}`}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`leaderboard-rank-delta leaderboard-rank-delta--${size} ${deltaInfo.isTopThree ? 'leaderboard-rank-delta--top-three' : ''} ${className}`}
      data-testid={testId}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      tabIndex={0}
      role="button"
      aria-label={getAriaLabel()}
      aria-haspopup={history && history.length > 0}
    >
      <div className="leaderboard-rank-delta__badge">
        {renderBadge()}
      </div>
      {renderTooltip()}
    </div>
  );
};

LeaderboardRankDelta.displayName = 'LeaderboardRankDelta';
export default LeaderboardRankDelta;