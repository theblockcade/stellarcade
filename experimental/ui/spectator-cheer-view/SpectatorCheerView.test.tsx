import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import { SpectatorCheerView, formatTimer, formatPot, formatViewerCount } from './SpectatorCheerView';
import type { LiveMatchData } from './types';

const mockMatch: LiveMatchData = {
  matchId: 'match-001',
  player1: 'Alice',
  player2: 'Bob',
  potAmount: 250.5,
  currentTurn: 'Alice',
  turnActions: [
    { playerId: 'p1', playerName: 'Alice', action: 'Placed bet', timestamp: 1000 },
    { playerId: 'p2', playerName: 'Bob', action: 'Called', timestamp: 2000 },
  ],
  elapsedSeconds: 125,
};

describe('formatTimer', () => {
  it('formats zero seconds as 00:00', () => {
    expect(formatTimer(0)).toBe('00:00');
  });

  it('formats seconds under a minute', () => {
    expect(formatTimer(45)).toBe('00:45');
  });

  it('formats minutes and seconds', () => {
    expect(formatTimer(125)).toBe('02:05');
  });

  it('pads single digits', () => {
    expect(formatTimer(61)).toBe('01:01');
  });
});

describe('formatPot', () => {
  it('formats with dollar sign and two decimals', () => {
    expect(formatPot(250.5)).toBe('$250.50');
  });

  it('formats whole numbers', () => {
    expect(formatPot(100)).toBe('$100.00');
  });

  it('formats large numbers with commas', () => {
    expect(formatPot(12500)).toBe('$12,500.00');
  });
});

describe('formatViewerCount', () => {
  it('returns plain number under 1000', () => {
    expect(formatViewerCount(42)).toBe('42');
  });

  it('formats thousands with K', () => {
    expect(formatViewerCount(1500)).toBe('1.5K');
  });

  it('formats millions with M', () => {
    expect(formatViewerCount(2_500_000)).toBe('2.5M');
  });
});

describe('SpectatorCheerView', () => {
  const defaultProps = {
    match: mockMatch,
    viewerCount: 42,
    onSendCheer: vi.fn(),
    onLeaveSpectator: vi.fn(),
  };

  it('renders the header with viewer count', () => {
    render(<SpectatorCheerView {...defaultProps} />);
    expect(screen.getByTestId('scv-viewer-count')).toHaveTextContent('42 Watching');
  });

  it('renders the active pot amount', () => {
    render(<SpectatorCheerView {...defaultProps} />);
    expect(screen.getByTestId('scv-pot')).toHaveTextContent('$250.50');
  });

  it('renders the match timer', () => {
    render(<SpectatorCheerView {...defaultProps} />);
    expect(screen.getByTestId('scv-timer')).toHaveTextContent('02:05');
  });

  it('renders player names', () => {
    render(<SpectatorCheerView {...defaultProps} />);
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Bob').length).toBeGreaterThan(0);
  });

  it('renders turn action timeline entries', () => {
    render(<SpectatorCheerView {...defaultProps} />);
    const timeline = screen.getByTestId('scv-timeline');
    expect(within(timeline).getByText(/Placed bet/)).toBeInTheDocument();
    expect(within(timeline).getByText(/Called/)).toBeInTheDocument();
  });

  it('shows empty timeline message when no actions', () => {
    const matchNoActions = { ...mockMatch, turnActions: [] };
    render(<SpectatorCheerView {...defaultProps} match={matchNoActions} />);
    expect(screen.getByText('Waiting for first move...')).toBeInTheDocument();
  });

  it('calls onSendCheer when a cheer button is clicked', () => {
    const onSendCheer = vi.fn();
    render(<SpectatorCheerView {...defaultProps} onSendCheer={onSendCheer} />);
    fireEvent.click(screen.getByTestId('scv-cheer-clap'));
    expect(onSendCheer).toHaveBeenCalledWith('clap');
  });

  it('spawns a floating particle when cheer is clicked', () => {
    render(<SpectatorCheerView {...defaultProps} />);
    fireEvent.click(screen.getByTestId('scv-cheer-fire'));
    const emitter = screen.getByTestId('floating-cheer-emitter');
    expect(emitter.querySelectorAll('[data-testid="fce-particle"]').length).toBe(1);
  });

  it('calls onLeaveSpectator when leave button is clicked', () => {
    const onLeaveSpectator = vi.fn();
    render(<SpectatorCheerView {...defaultProps} onLeaveSpectator={onLeaveSpectator} />);
    fireEvent.click(screen.getByTestId('scv-leave-btn'));
    expect(onLeaveSpectator).toHaveBeenCalledOnce();
  });

  it('renders all three cheer buttons', () => {
    render(<SpectatorCheerView {...defaultProps} />);
    expect(screen.getByTestId('scv-cheer-clap')).toBeInTheDocument();
    expect(screen.getByTestId('scv-cheer-fire')).toBeInTheDocument();
    expect(screen.getByTestId('scv-cheer-diamond')).toBeInTheDocument();
  });

  it('accepts custom className', () => {
    render(<SpectatorCheerView {...defaultProps} className="custom-class" />);
    expect(screen.getByTestId('spectator-cheer-view').className).toContain('custom-class');
  });
});
