import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TournamentBracketTree } from './TournamentBracketTree';
import { BracketTree } from './types';

describe('TournamentBracketTree', () => {
  const sampleBracket: BracketTree = {
    id: 'b1',
    name: 'Summer Championship 8-Player',
    rounds: [
      {
        roundNumber: 1,
        title: 'Quarterfinals',
        matchups: [
          {
            id: 'm1',
            player1: { id: 'p1', username: 'Alice', score: 2 },
            player2: { id: 'p2', username: 'Bob', score: 1 },
            winnerId: 'p1',
            isCompleted: true,
          },
          {
            id: 'm2',
            player1: { id: 'p3', username: 'Charlie', score: 0 },
            player2: { id: 'p4', username: 'David', score: 2 },
            winnerId: 'p4',
            isCompleted: true,
          },
        ],
      },
      {
        roundNumber: 2,
        title: 'Finals',
        matchups: [
          {
            id: 'm3',
            player1: { id: 'p1', username: 'Alice', score: 3 },
            player2: { id: 'p4', username: 'David', score: 1 },
            winnerId: 'p1',
            isCompleted: true,
          },
        ],
      },
    ],
  };

  it('renders complete 8-player bracket tree rounds and players', () => {
    render(
      <TournamentBracketTree
        bracketData={sampleBracket}
        onSelectMatchup={vi.fn()}
      />
    );

    expect(screen.getByTestId('tournament-bracket-tree')).toBeDefined();
    expect(screen.getByText('Summer Championship 8-Player')).toBeDefined();
    expect(screen.getByText('Quarterfinals')).toBeDefined();
    expect(screen.getByText('Finals')).toBeDefined();
    expect(screen.getByText('Alice')).toBeDefined();
    expect(screen.getByText('Bob')).toBeDefined();
  });

  it('clicking matchup node fires onSelectMatchup callback', () => {
    const onSelectMock = vi.fn();

    render(
      <TournamentBracketTree
        bracketData={sampleBracket}
        onSelectMatchup={onSelectMock}
      />
    );

    const matchupNode = screen.getByTestId('matchup-node-m1');
    fireEvent.click(matchupNode);

    expect(onSelectMock).toHaveBeenCalledWith('m1');
  });

  it('highlights player path for designated player ID', () => {
    render(
      <TournamentBracketTree
        bracketData={sampleBracket}
        onSelectMatchup={vi.fn()}
        highlightPlayerId="p1"
      />
    );

    const playerRow = screen.getByTestId('player-row-p1');
    expect(playerRow.className).toContain('highlighted-player');
  });

  it('handles zoom controls', () => {
    render(
      <TournamentBracketTree
        bracketData={sampleBracket}
        onSelectMatchup={vi.fn()}
      />
    );

    const zoomInBtn = screen.getByTestId('zoom-in-btn');
    fireEvent.click(zoomInBtn);

    expect(screen.getByTestId('zoom-level').textContent).toBe('110%');
  });
});
