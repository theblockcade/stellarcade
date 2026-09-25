'use client';

import React, { useMemo, useState } from 'react';
import {
  BracketView,
  TournamentBracketTreeProps,
  TournamentMatch,
  TournamentPlayer,
  TournamentRound,
} from './types';
import './TournamentBracketTree.css';

const getInitials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

const isValidRounds = (rounds: TournamentRound[]): boolean =>
  rounds.length > 0 && rounds.some((round) => round.matches.length > 0);

const getNextMatchIndex = (matchIndex: number): number =>
  Math.floor(matchIndex / 2);

interface ConnectorSegment {
  from: number;
  to: number;
  prevCount: number;
  nextCount: number;
}

export const TournamentBracketTree: React.FC<TournamentBracketTreeProps> = ({
  rounds,
  activeMatchId,
  onSelectMatch,
  className = '',
  testId = 'tournament-bracket-tree',
  defaultView = 'full',
}) => {
  const [view, setView] = useState<BracketView>(defaultView);
  const [highlightedPlayerId, setHighlightedPlayerId] = useState<string | null>(null);

  const hasFixtures = useMemo(() => isValidRounds(rounds), [rounds]);

  const connectorSegments = useMemo<ConnectorSegment[][]>(() => {
    return rounds.slice(0, -1).map((round, index) => {
      const next = rounds[index + 1];
      return round.matches.map((match) => ({
        from: match.matchIndex,
        to: getNextMatchIndex(match.matchIndex),
        prevCount: round.matches.length,
        nextCount: next.matches.length,
      }));
    });
  }, [rounds]);

  const renderPlayerSlot = (
    player: TournamentPlayer | null,
    score: number | null,
    winnerId: string | null | undefined,
  ) => {
    const isWinner = !!player && winnerId === player.id;
    const isLoser = !!player && !!winnerId && winnerId !== player.id;
    const isHighlighted = !!player && highlightedPlayerId === player.id;

    if (!player) {
      return (
        <div className="tournament-bracket-tree__player tournament-bracket-tree__player--tbd">
          <span className="tournament-bracket-tree__player-initials">TBD</span>
          <span className="tournament-bracket-tree__player-name">Awaiting fixture</span>
        </div>
      );
    }

    return (
      <div
        className={`tournament-bracket-tree__player ${isWinner ? 'tournament-bracket-tree__player--winner' : ''} ${
          isLoser ? 'tournament-bracket-tree__player--loser' : ''
        }`}
        data-player-id={player.id}
        data-highlighted={isHighlighted}
        onMouseEnter={() => setHighlightedPlayerId(player.id)}
        onMouseLeave={() => setHighlightedPlayerId(null)}
        onFocus={() => setHighlightedPlayerId(player.id)}
        onBlur={() => setHighlightedPlayerId(null)}
      >
        {player.avatar ? (
          <img
            className="tournament-bracket-tree__player-avatar"
            src={player.avatar}
            alt=""
          />
        ) : (
          <span className="tournament-bracket-tree__player-initials">
            {getInitials(player.name)}
          </span>
        )}
        <span className="tournament-bracket-tree__player-name">{player.name}</span>
        <span className="tournament-bracket-tree__player-score">
          {score ?? '–'}
        </span>
      </div>
    );
  };

  const handleMatchKeyDown = (
    event: React.KeyboardEvent,
    match: TournamentMatch,
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelectMatch?.(match);
    }
  };

  if (!hasFixtures) {
    return (
      <div
        className={`tournament-bracket-tree ${className}`}
        data-testid={testId}
      >
        <div
          className="tournament-bracket-tree__empty"
          data-testid={`${testId}-empty`}
        >
          <p className="tournament-bracket-tree__empty-title">No fixtures yet</p>
          <p className="tournament-bracket-tree__empty-text">
            Rounds have not been seeded. Check back once matchups are announced.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`tournament-bracket-tree ${className}`}
      data-testid={testId}
      role="region"
      aria-label="Tournament bracket"
    >
      <div className="tournament-bracket-tree__toolbar">
        <h2 className="tournament-bracket-tree__title">Tournament Bracket</h2>
        <button
          type="button"
          className="tournament-bracket-tree__view-toggle"
          aria-pressed={view === 'full'}
          onClick={() => setView((current) => (current === 'full' ? 'compact' : 'full'))}
          data-testid={`${testId}-view-toggle`}
        >
          {view === 'full' ? 'Compact view' : 'Full bracket'}
        </button>
      </div>

      <div
        className={`tournament-bracket-tree__canvas tournament-bracket-tree__canvas--${view}`}
        data-testid={`${testId}-canvas`}
        data-view={view}
      >
        {rounds.map((round, roundIndex) => (
          <React.Fragment key={round.id}>
            <section
              className="tournament-bracket-tree__round"
              aria-label={round.name}
              data-testid={`${testId}-round-${round.id}`}
            >
              <h3 className="tournament-bracket-tree__round-name">{round.name}</h3>
              <div className="tournament-bracket-tree__round-matches">
                {round.matches.map((match) => {
                  const isActive = match.id === activeMatchId;
                  return (
                    <article
                      key={match.id}
                      className={`tournament-bracket-tree__match ${
                        isActive ? 'tournament-bracket-tree__match--active' : ''
                      }`}
                      data-testid={`${testId}-match-${match.id}`}
                      data-status={match.status ?? 'pending'}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isActive}
                      onClick={() => onSelectMatch?.(match)}
                      onKeyDown={(event) => handleMatchKeyDown(event, match)}
                    >
                      {renderPlayerSlot(
                        match.players[0],
                        match.scores?.[0] ?? null,
                        match.winnerId,
                      )}
                      {renderPlayerSlot(
                        match.players[1],
                        match.scores?.[1] ?? null,
                        match.winnerId,
                      )}
                    </article>
                  );
                })}
              </div>
            </section>

            {roundIndex < rounds.length - 1 && (
              <div
                className="tournament-bracket-tree__connectors"
                aria-hidden="true"
              >
                <svg
                  className="tournament-bracket-tree__connectors-svg"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  {connectorSegments[roundIndex].map((segment, segmentIndex) => {
                    const fromY = ((segment.from + 0.5) / segment.prevCount) * 100;
                    const toY = ((segment.to + 0.5) / segment.nextCount) * 100;
                    return (
                      <path
                        key={`${segment.from}-${segmentIndex}`}
                        className="tournament-bracket-tree__connector-path"
                        d={`M 0 ${fromY} H 30 C 40 ${fromY} 60 ${toY} 70 ${toY} H 100`}
                      />
                    );
                  })}
                </svg>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

TournamentBracketTree.displayName = 'TournamentBracketTree';
export default TournamentBracketTree;