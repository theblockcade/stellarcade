import React, { useState, useMemo } from 'react';
import './LeaderboardComparer.css';

export interface Player {
  id: string;
  name: string;
  avatarUrl?: string;
  rank?: string | number;
  stats: Record<string, number | string>;
}

export interface Metric {
  key: string;
  label: string;
  format?: (val: any) => string;
  higherIsBetter?: boolean;
}

export interface LeaderboardComparerProps {
  availablePlayers: Player[];
  metrics: Metric[];
  initialPlayerAId?: string;
  initialPlayerBId?: string;
  onPlayerChange?: (side: 'A' | 'B', playerId: string) => void;
  className?: string;
  testId?: string;
}

export const LeaderboardComparer: React.FC<LeaderboardComparerProps> = ({
  availablePlayers = [],
  metrics = [],
  initialPlayerAId,
  initialPlayerBId,
  onPlayerChange,
  className = '',
  testId = 'leaderboard-comparer',
}) => {
  // If no players are available, render empty state
  const hasPlayers = availablePlayers.length > 0;

  // Track selected players for left (A) and right (B) sides
  const [playerAId, setPlayerAId] = useState<string>(
    initialPlayerAId || (hasPlayers ? availablePlayers[0].id : '')
  );
  const [playerBId, setPlayerBId] = useState<string>(
    initialPlayerBId || (hasPlayers && availablePlayers.length > 1 ? availablePlayers[1].id : hasPlayers ? availablePlayers[0].id : '')
  );

  // Track the currently active/focused metric for detailed visualization
  const [selectedMetricKey, setSelectedMetricKey] = useState<string>(
    metrics.length > 0 ? metrics[0].key : ''
  );

  // Resolve player objects
  const playerA = useMemo(() => availablePlayers.find((p) => p.id === playerAId), [availablePlayers, playerAId]);
  const playerB = useMemo(() => availablePlayers.find((p) => p.id === playerBId), [availablePlayers, playerBId]);

  // Handle dropdown selection changes
  const handlePlayerSelect = (side: 'A' | 'B', id: string) => {
    if (side === 'A') {
      setPlayerAId(id);
      onPlayerChange?.('A', id);
    } else {
      setPlayerBId(id);
      onPlayerChange?.('B', id);
    }
  };

  // Swap Left and Right players
  const handleSwap = () => {
    const temp = playerAId;
    setPlayerAId(playerBId);
    setPlayerBId(temp);
    onPlayerChange?.('A', playerBId);
    onPlayerChange?.('B', temp);
  };

  if (!hasPlayers || metrics.length === 0) {
    return (
      <div className="leaderboard-comparer leaderboard-comparer--empty" data-testid={`${testId}-empty`}>
        <p>No players or metrics available to compare.</p>
      </div>
    );
  }

  // Get active metric detail
  const activeMetric = metrics.find((m) => m.key === selectedMetricKey) || metrics[0];

  // Helper function to calculate advantage
  const getAdvantage = (valA: any, valB: any, higherIsBetter = true) => {
    const numA = Number(valA);
    const numB = Number(valB);
    if (isNaN(numA) || isNaN(numB)) return 'none';
    if (numA === numB) return 'equal';
    if (higherIsBetter) {
      return numA > numB ? 'A' : 'B';
    } else {
      return numA < numB ? 'A' : 'B';
    }
  };

  // Calculations for detail visual comparison
  const valA = playerA?.stats[activeMetric.key];
  const valB = playerB?.stats[activeMetric.key];
  const numA = Number(valA) || 0;
  const numB = Number(valB) || 0;
  const sum = numA + numB;
  const pctA = sum > 0 ? (numA / sum) * 100 : 50;
  const pctB = sum > 0 ? (numB / sum) * 100 : 50;

  return (
    <div className={`leaderboard-comparer ${className}`} data-testid={testId}>
      {/* Player Selectors & Headers */}
      <div className="leaderboard-comparer__headers">
        {/* Player A Select Card */}
        <div className="leaderboard-comparer__player-card" data-testid={`${testId}-player-a`}>
          <label htmlFor="player-a-select" className="sr-only">Select Player A</label>
          <select
            id="player-a-select"
            value={playerAId}
            onChange={(e) => handlePlayerSelect('A', e.target.value)}
            className="leaderboard-comparer__select"
            data-testid={`${testId}-select-a`}
          >
            {availablePlayers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {playerA && (
            <div className="leaderboard-comparer__player-info">
              {playerA.avatarUrl ? (
                <img src={playerA.avatarUrl} alt={playerA.name} className="leaderboard-comparer__avatar" />
              ) : (
                <div className="leaderboard-comparer__avatar-placeholder">
                  {playerA.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              {playerA.rank && (
                <span className="leaderboard-comparer__rank-badge" data-testid={`${testId}-rank-a`}>
                  Rank #{playerA.rank}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Swap Control */}
        <div className="leaderboard-comparer__swap-wrapper">
          <button
            type="button"
            className="leaderboard-comparer__swap-btn"
            onClick={handleSwap}
            aria-label="Swap compared players"
            data-testid={`${testId}-swap-button`}
          >
            ⇄
          </button>
        </div>

        {/* Player B Select Card */}
        <div className="leaderboard-comparer__player-card" data-testid={`${testId}-player-b`}>
          <label htmlFor="player-b-select" className="sr-only">Select Player B</label>
          <select
            id="player-b-select"
            value={playerBId}
            onChange={(e) => handlePlayerSelect('B', e.target.value)}
            className="leaderboard-comparer__select"
            data-testid={`${testId}-select-b`}
          >
            {availablePlayers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {playerB && (
            <div className="leaderboard-comparer__player-info">
              {playerB.avatarUrl ? (
                <img src={playerB.avatarUrl} alt={playerB.name} className="leaderboard-comparer__avatar" />
              ) : (
                <div className="leaderboard-comparer__avatar-placeholder">
                  {playerB.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              {playerB.rank && (
                <span className="leaderboard-comparer__rank-badge" data-testid={`${testId}-rank-b`}>
                  Rank #{playerB.rank}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comparisons List */}
      <div className="leaderboard-comparer__stats-list" role="grid" aria-label="Player comparison table">
        {metrics.map((metric) => {
          const statA = playerA?.stats[metric.key];
          const statB = playerB?.stats[metric.key];
          const formattedA = metric.format ? metric.format(statA) : String(statA ?? '—');
          const formattedB = metric.format ? metric.format(statB) : String(statB ?? '—');
          
          const advantage = getAdvantage(statA, statB, metric.higherIsBetter);
          const isSelected = metric.key === selectedMetricKey;

          return (
            <div
              key={metric.key}
              className={`leaderboard-comparer__row ${isSelected ? 'leaderboard-comparer__row--selected' : ''}`}
              onClick={() => setSelectedMetricKey(metric.key)}
              role="row"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedMetricKey(metric.key);
                }
              }}
              data-testid={`${testId}-metric-row-${metric.key}`}
            >
              {/* Stat A */}
              <div
                className={`leaderboard-comparer__cell leaderboard-comparer__cell--val ${
                  advantage === 'A' ? 'leaderboard-comparer__cell--winner' : ''
                }`}
                role="gridcell"
              >
                <span className="leaderboard-comparer__val-text">{formattedA}</span>
                {advantage === 'A' && <span className="leaderboard-comparer__indicator" aria-label="Superior stat">▲</span>}
              </div>

              {/* Metric Label */}
              <div className="leaderboard-comparer__cell leaderboard-comparer__cell--label" role="rowheader">
                {metric.label}
              </div>

              {/* Stat B */}
              <div
                className={`leaderboard-comparer__cell leaderboard-comparer__cell--val ${
                  advantage === 'B' ? 'leaderboard-comparer__cell--winner' : ''
                }`}
                role="gridcell"
              >
                {advantage === 'B' && <span className="leaderboard-comparer__indicator" aria-label="Superior stat">▲</span>}
                <span className="leaderboard-comparer__val-text">{formattedB}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Metric Detailed Visualization */}
      <div className="leaderboard-comparer__detail-panel" data-testid={`${testId}-detail-panel`}>
        <h3 className="leaderboard-comparer__detail-title">
          Detail Analysis: {activeMetric.label}
        </h3>
        <div className="leaderboard-comparer__visual-bar" aria-hidden="true">
          <div
            className="leaderboard-comparer__visual-bar-fill leaderboard-comparer__visual-bar-fill--a"
            style={{ width: `${pctA}%` }}
          />
          <div
            className="leaderboard-comparer__visual-bar-fill leaderboard-comparer__visual-bar-fill--b"
            style={{ width: `${pctB}%` }}
          />
        </div>
        <div className="leaderboard-comparer__detail-labels">
          <span className="leaderboard-comparer__detail-label-a">
            {playerA?.name}: {pctA.toFixed(0)}%
          </span>
          <span className="leaderboard-comparer__detail-label-b">
            {playerB?.name}: {pctB.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
};

LeaderboardComparer.displayName = 'LeaderboardComparer';
export default LeaderboardComparer;
