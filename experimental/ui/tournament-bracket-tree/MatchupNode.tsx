import React from 'react';
import { BracketMatchup, BracketPlayer } from './types';

export interface MatchupNodeProps {
  matchup: BracketMatchup;
  onSelect: (id: string) => void;
  highlightPlayerId?: string;
}

export const MatchupNode: React.FC<MatchupNodeProps> = ({
  matchup,
  onSelect,
  highlightPlayerId,
}) => {
  const isPlayerHighlighted = (player?: BracketPlayer) => {
    return highlightPlayerId && player && player.id === highlightPlayerId;
  };

  const isPlayerWinner = (player?: BracketPlayer) => {
    return matchup.winnerId && player && player.id === matchup.winnerId;
  };

  const hasHighlightedPath =
    isPlayerHighlighted(matchup.player1) || isPlayerHighlighted(matchup.player2);

  return (
    <div
      className={`matchup-node ${matchup.isCompleted ? 'completed' : 'pending'} ${
        hasHighlightedPath ? 'highlighted-path' : ''
      }`}
      onClick={() => onSelect(matchup.id)}
      data-testid={`matchup-node-${matchup.id}`}
    >
      <div
        className={`player-row ${isPlayerWinner(matchup.player1) ? 'winner' : ''} ${
          isPlayerHighlighted(matchup.player1) ? 'highlighted-player' : ''
        }`}
        data-testid={`player-row-${matchup.player1?.id || 'tbd-1'}`}
      >
        <span className="player-name">
          {matchup.player1 ? matchup.player1.username : 'TBD'}
        </span>
        <span className="player-score">
          {matchup.player1?.score !== undefined ? matchup.player1.score : '-'}
        </span>
      </div>

      <div className="matchup-divider" />

      <div
        className={`player-row ${isPlayerWinner(matchup.player2) ? 'winner' : ''} ${
          isPlayerHighlighted(matchup.player2) ? 'highlighted-player' : ''
        }`}
        data-testid={`player-row-${matchup.player2?.id || 'tbd-2'}`}
      >
        <span className="player-name">
          {matchup.player2 ? matchup.player2.username : 'TBD'}
        </span>
        <span className="player-score">
          {matchup.player2?.score !== undefined ? matchup.player2.score : '-'}
        </span>
      </div>
    </div>
  );
};
