import React, { useState } from 'react';
import { TournamentBracketTreeProps } from './types';
import { MatchupNode } from './MatchupNode';

export const TournamentBracketTree: React.FC<TournamentBracketTreeProps> = ({
  bracketData,
  onSelectMatchup,
  highlightPlayerId,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.1, 1.5));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.1, 0.6));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div className="tournament-bracket-tree-container" data-testid="tournament-bracket-tree">
      <header className="bracket-header">
        <h3 className="bracket-title">{bracketData.name}</h3>
        <div className="zoom-controls">
          <button type="button" onClick={handleZoomOut} data-testid="zoom-out-btn">
            −
          </button>
          <span data-testid="zoom-level">{Math.round(zoomLevel * 100)}%</span>
          <button type="button" onClick={handleZoomIn} data-testid="zoom-in-btn">
            +
          </button>
          <button type="button" onClick={handleResetZoom} data-testid="zoom-reset-btn">
            Reset
          </button>
        </div>
      </header>

      <div className="bracket-viewport" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}>
        <div className="bracket-rounds-wrapper">
          {bracketData.rounds.map((round) => (
            <div key={round.roundNumber} className="bracket-round" data-testid={`bracket-round-${round.roundNumber}`}>
              <h4 className="round-header">{round.title}</h4>
              <div className="round-matchups">
                {round.matchups.map((matchup) => (
                  <div key={matchup.id} className="matchup-wrapper">
                    <MatchupNode
                      matchup={matchup}
                      onSelect={onSelectMatchup}
                      highlightPlayerId={highlightPlayerId}
                    />
                    {/* SVG Connector path representation */}
                    <svg className="connector-svg" width="20" height="40" aria-hidden="true">
                      <path d="M 0 20 L 20 20" stroke="rgba(255,255,255,0.2)" strokeWidth="2" fill="none" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
