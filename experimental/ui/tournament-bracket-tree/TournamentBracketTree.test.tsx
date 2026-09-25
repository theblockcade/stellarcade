import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { TournamentBracketTree } from './TournamentBracketTree';
import type { TournamentMatch, TournamentRound } from './types';

afterEach(cleanup);

const players = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel'].map(
  (name, index) => ({ id: `p${index + 1}`, name }),
);

const toMatch = (
  id: string,
  round: number,
  matchIndex: number,
  first: number,
  second: number,
  winner: number | null,
): TournamentMatch => ({
  id,
  round,
  matchIndex,
  players: [players[first], players[second]],
  scores: winner === null ? [null, null] : [(winner === first ? 2 : 1), (winner === second ? 2 : 1)],
  winnerId: winner === null ? null : players[winner].id,
  status: winner === null ? 'pending' : 'completed',
});

const buildBracket = (): TournamentRound[] => [
  {
    id: 'qf',
    name: 'Quarterfinals',
    matches: [
      toMatch('qf-0', 0, 0, 0, 1, 0),
      toMatch('qf-1', 0, 1, 2, 3, 2),
      toMatch('qf-2', 0, 2, 4, 5, 5),
      toMatch('qf-3', 0, 3, 6, 7, 6),
    ],
  },
  {
    id: 'sf',
    name: 'Semifinals',
    matches: [toMatch('sf-0', 1, 0, 0, 2, 0), toMatch('sf-1', 1, 1, 6, 4, 6)],
  },
  {
    id: 'fin',
    name: 'Finals',
    matches: [toMatch('fin-0', 2, 0, 0, 6, 6)],
  },
];

describe('TournamentBracketTree', () => {
  it('renders a standard 8-player / 3-round bracket', () => {
    render(<TournamentBracketTree rounds={buildBracket()} />);

    expect(screen.getByText('Quarterfinals')).toBeInTheDocument();
    expect(screen.getByText('Semifinals')).toBeInTheDocument();
    expect(screen.getByText('Finals')).toBeInTheDocument();

    expect(
      screen.getAllByTestId(/tournament-bracket-tree-match-/),
    ).toHaveLength(7);

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Hotel')).toBeInTheDocument();
  });

  it('renders the empty state message when rounds are empty', () => {
    render(<TournamentBracketTree rounds={[]} />);

    expect(
      screen.getByTestId('tournament-bracket-tree-empty'),
    ).toBeInTheDocument();
    expect(screen.getByText('No fixtures yet')).toBeInTheDocument();
  });

  it('renders the empty state when rounds exist but have no matches', () => {
    render(
      <TournamentBracketTree
        rounds={[{ id: 'sf', name: 'Semifinals', matches: [] }]}
      />,
    );

    expect(
      screen.getByTestId('tournament-bracket-tree-empty'),
    ).toBeInTheDocument();
  });

  it('triggers onSelectMatch when a match card is clicked', () => {
    const onSelectMatch = vi.fn();
    render(
      <TournamentBracketTree
        rounds={buildBracket()}
        onSelectMatch={onSelectMatch}
      />,
    );

    fireEvent.click(screen.getByTestId('tournament-bracket-tree-match-qf-0'));

    expect(onSelectMatch).toHaveBeenCalledTimes(1);
    expect(onSelectMatch).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'qf-0' }),
    );
  });

  it('triggers onSelectMatch via keyboard Enter', () => {
    const onSelectMatch = vi.fn();
    render(
      <TournamentBracketTree
        rounds={buildBracket()}
        onSelectMatch={onSelectMatch}
      />,
    );

    const card = screen.getByTestId('tournament-bracket-tree-match-fin-0');
    fireEvent.keyDown(card, { key: 'Enter' });

    expect(onSelectMatch).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'fin-0' }),
    );
  });

  it('triggers onSelectMatch via keyboard Space', () => {
    const onSelectMatch = vi.fn();
    render(
      <TournamentBracketTree
        rounds={buildBracket()}
        onSelectMatch={onSelectMatch}
      />,
    );

    fireEvent.keyDown(screen.getByTestId('tournament-bracket-tree-match-sf-1'), {
      key: ' ',
    });

    expect(onSelectMatch).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'sf-1' }),
    );
  });

  it('makes match cards keyboard focusable and interactive', () => {
    render(<TournamentBracketTree rounds={buildBracket()} />);

    const card = screen.getByTestId('tournament-bracket-tree-match-qf-1');
    expect(card).toHaveAttribute('role', 'button');
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  it('highlights the active match card', () => {
    render(<TournamentBracketTree rounds={buildBracket()} activeMatchId="sf-0" />);

    expect(screen.getByTestId('tournament-bracket-tree-match-sf-0')).toHaveClass(
      'tournament-bracket-tree__match--active',
    );
  });

  it('styles winners and losers within a match card', () => {
    render(<TournamentBracketTree rounds={buildBracket()} />);

    const card = screen.getByTestId('tournament-bracket-tree-match-qf-0');
    const winnerSlot = card.querySelector('[data-player-id="p1"]') as HTMLElement;
    const loserSlot = card.querySelector('[data-player-id="p2"]') as HTMLElement;

    expect(winnerSlot).toHaveClass(
      'tournament-bracket-tree__player--winner',
    );
    expect(loserSlot).toHaveClass('tournament-bracket-tree__player--loser');
  });

  it('toggles between compact and full views', () => {
    render(<TournamentBracketTree rounds={buildBracket()} />);

    const canvas = screen.getByTestId('tournament-bracket-tree-canvas');
    expect(canvas).toHaveAttribute('data-view', 'full');

    fireEvent.click(screen.getByTestId('tournament-bracket-tree-view-toggle'));
    expect(canvas).toHaveAttribute('data-view', 'compact');

    fireEvent.click(screen.getByTestId('tournament-bracket-tree-view-toggle'));
    expect(canvas).toHaveAttribute('data-view', 'full');
  });

  it('renders connector groups between consecutive rounds', () => {
    const { container } = render(
      <TournamentBracketTree rounds={buildBracket()} />,
    );

    const connectorGroups = container.querySelectorAll(
      '.tournament-bracket-tree__connectors',
    );
    expect(connectorGroups).toHaveLength(2);

    const svg = container.querySelectorAll(
      '.tournament-bracket-tree__connectors-svg',
    );
    svg.forEach((node) => expect(node).toHaveAttribute('preserveAspectRatio', 'none'));
  });

  it('highlights a players path across rounds on hover', () => {
    render(<TournamentBracketTree rounds={buildBracket()} />);

    const qfSlot = screen
      .getByTestId('tournament-bracket-tree-match-qf-0')
      .querySelector('[data-player-id="p1"]') as HTMLElement;

    fireEvent.mouseEnter(qfSlot);

    const semisSlot = screen
      .getByTestId('tournament-bracket-tree-match-sf-0')
      .querySelector('[data-player-id="p1"]') as HTMLElement;

    expect(semisSlot).toHaveAttribute('data-highlighted', 'true');

    fireEvent.mouseLeave(qfSlot);
    expect(semisSlot).toHaveAttribute('data-highlighted', 'false');
  });
});