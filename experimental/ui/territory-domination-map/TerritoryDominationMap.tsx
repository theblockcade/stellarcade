import React, { useMemo } from "react";
import type { TerritoryDominationMapProps } from "./types";
import { TerritorySector } from "./TerritorySector";

export const TerritoryDominationMap: React.FC<TerritoryDominationMapProps> = ({
  territories,
  players,
  currentPlayerId,
  selectedTerritoryId,
  onTerritoryClick,
  width = 600,
  height = 400,
}) => {
  const playerColorMap = useMemo(
    () => new Map(players.map((p) => [p.id, p.color])),
    [players]
  );

  const currentPlayer = useMemo(
    () => players.find((p) => p.id === currentPlayerId),
    [players, currentPlayerId]
  );

  const leaderboard = useMemo(
    () => [...players].sort((a, b) => b.territoriesOwned - a.territoriesOwned),
    [players]
  );

  return (
    <div className="territory-map-container" data-testid="territory-map-container">
      {currentPlayer && (
        <div className="territory-map__player-info" data-testid="current-player-info">
          <span
            className="territory-map__player-dot"
            style={{ background: currentPlayer.color }}
            data-testid="current-player-color"
          />
          <span data-testid="current-player-name">{currentPlayer.username}</span>
          <span data-testid="current-player-territories">
            {currentPlayer.territoriesOwned} territories
          </span>
        </div>
      )}

      <svg
        className="territory-map__svg"
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        data-testid="territory-map-svg"
        aria-label="Territory domination map"
        role="img"
      >
        {territories.map((territory) => (
          <TerritorySector
            key={territory.id}
            territory={territory}
            ownerColor={
              territory.ownerId ? playerColorMap.get(territory.ownerId) : undefined
            }
            isSelected={territory.id === selectedTerritoryId}
            onClick={onTerritoryClick}
          />
        ))}
      </svg>

      <div className="territory-map__leaderboard" data-testid="leaderboard">
        {leaderboard.map((player, rank) => (
          <div
            key={player.id}
            className="territory-map__leaderboard-row"
            data-testid={`leaderboard-row-${player.id}`}
          >
            <span className="territory-map__leaderboard-rank">{rank + 1}</span>
            <span
              className="territory-map__leaderboard-dot"
              style={{ background: player.color }}
            />
            <span data-testid={`leaderboard-name-${player.id}`}>{player.username}</span>
            <span data-testid={`leaderboard-territories-${player.id}`}>
              {player.territoriesOwned}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
