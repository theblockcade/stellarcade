import React from 'react';
import './GameLeaderboardPreviewCard.css';

export interface LeaderboardEntry {
  rank: number;
  playerName: string;
  score: number;
  avatarUrl?: string;
}

export interface GameLeaderboardPreviewCardProps {
  gameId: string;
  gameName: string;
  entries: LeaderboardEntry[];
  totalPlayers?: number;
  lastUpdated?: string;
  isLoading?: boolean;
  emptyLabel?: string;
  className?: string;
  testId?: string;
}

function getRankBadgeClass(rank: number): string {
  if (rank === 1) return 'rank-badge rank-badge--gold';
  if (rank === 2) return 'rank-badge rank-badge--silver';
  if (rank === 3) return 'rank-badge rank-badge--bronze';
  return 'rank-badge';
}

function formatScore(score: number): string {
  if (score >= 1_000_000) {
    return `${(score / 1_000_000).toFixed(1)}M`;
  }
  if (score >= 1_000) {
    return `${(score / 1_000).toFixed(1)}K`;
  }
  return score.toLocaleString();
}

export const GameLeaderboardPreviewCard: React.FC<GameLeaderboardPreviewCardProps> = ({
  gameId,
  gameName,
  entries,
  totalPlayers,
  lastUpdated,
  isLoading = false,
  emptyLabel = 'No leaderboard data yet',
  className = '',
  testId = 'game-leaderboard-preview',
}) => {
  if (isLoading) {
    return (
      <div
        className={`leaderboard-preview-card leaderboard-preview-card--loading ${className}`}
        data-testid={`${testId}-loading`}
        role="status"
        aria-label={`Loading ${gameName} leaderboard`}
        aria-live="polite"
      >
        <div className="leaderboard-preview-card__skeleton" aria-hidden="true" />
        <span className="leaderboard-preview-card__sr-only">Loading…</span>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div
        className={`leaderboard-preview-card leaderboard-preview-card--empty ${className}`}
        data-testid={`${testId}-empty`}
        role="status"
        aria-label={`${gameName} leaderboard: ${emptyLabel}`}
      >
        {emptyLabel}
      </div>
    );
  }

  return (
    <div
      className={`leaderboard-preview-card ${className}`}
      data-testid={testId}
      aria-label={`${gameName} leaderboard preview`}
    >
      <div className="leaderboard-preview-card__header">
        <h3 className="leaderboard-preview-card__title">{gameName}</h3>
        <span className="leaderboard-preview-card__game-id">#{gameId.slice(0, 8)}</span>
      </div>

      <ol
        className="leaderboard-preview-card__list"
        aria-label={`${gameName} top players`}
      >
        {entries.slice(0, 5).map((entry) => (
          <li
            key={`${entry.playerName}-${entry.rank}`}
            className="leaderboard-preview-card__entry"
            data-testid={`${testId}-entry-${entry.rank}`}
            aria-label={`Rank ${entry.rank}: ${entry.playerName}, score ${entry.score.toLocaleString()}`}
          >
            <span
              className={getRankBadgeClass(entry.rank)}
              aria-hidden="true"
            >
              #{entry.rank}
            </span>
            <span className="leaderboard-preview-card__avatar">
              {entry.avatarUrl ? (
                <img
                  src={entry.avatarUrl}
                  alt=""
                  className="leaderboard-preview-card__avatar-img"
                  aria-hidden="true"
                />
              ) : (
                <span className="leaderboard-preview-card__avatar-placeholder">
                  {entry.playerName.slice(0, 2).toUpperCase()}
                </span>
              )}
            </span>
            <span className="leaderboard-preview-card__name">
              {entry.playerName}
            </span>
            <span className="leaderboard-preview-card__score">
              {formatScore(entry.score)}
            </span>
          </li>
        ))}
      </ol>

      <div className="leaderboard-preview-card__footer">
        {totalPlayers !== undefined && (
          <span className="leaderboard-preview-card__players">
            {totalPlayers} total players
          </span>
        )}
        {lastUpdated && (
          <span className="leaderboard-preview-card__updated">
            Updated {lastUpdated}
          </span>
        )}
      </div>
    </div>
  );
};

GameLeaderboardPreviewCard.displayName = 'GameLeaderboardPreviewCard';
export default GameLeaderboardPreviewCard;
