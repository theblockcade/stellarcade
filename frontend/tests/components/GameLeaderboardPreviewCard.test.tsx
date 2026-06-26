/**
 * @vitest-environment happy-dom
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it } from 'vitest';
import { GameLeaderboardPreviewCard, type LeaderboardEntry } from '@/components/v1/GameLeaderboardPreviewCard';

const mockEntries: LeaderboardEntry[] = [
  { rank: 1, playerName: 'Alice', score: 9500 },
  { rank: 2, playerName: 'Bob', score: 8200 },
  { rank: 3, playerName: 'Charlie', score: 7100 },
  { rank: 4, playerName: 'Diana', score: 6500 },
  { rank: 5, playerName: 'Eve', score: 5800 },
];

describe('GameLeaderboardPreviewCard (#1005)', () => {
  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------
  it('renders the default empty message when entries array is empty', () => {
    render(
      <GameLeaderboardPreviewCard gameId="game-1" gameName="Coin Flip" entries={[]} />
    );
    expect(screen.getByText('No leaderboard data yet')).toBeInTheDocument();
  });

  it('renders a custom empty message when provided', () => {
    render(
      <GameLeaderboardPreviewCard
        gameId="game-1"
        gameName="Coin Flip"
        entries={[]}
        emptyLabel="Be the first to play!"
      />
    );
    expect(screen.getByText('Be the first to play!')).toBeInTheDocument();
  });

  it('empty state has role=status for accessibility', () => {
    render(
      <GameLeaderboardPreviewCard gameId="game-1" gameName="Coin Flip" entries={[]} />
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  it('renders a loading indicator when isLoading is true', () => {
    render(
      <GameLeaderboardPreviewCard
        gameId="game-1"
        gameName="Coin Flip"
        entries={mockEntries}
        isLoading
      />
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('loading state has aria-live=polite', () => {
    render(
      <GameLeaderboardPreviewCard
        gameId="game-1"
        gameName="Coin Flip"
        entries={mockEntries}
        isLoading
      />
    );
    const el = screen.getByRole('status');
    expect(el).toHaveAttribute('aria-live', 'polite');
  });

  // ---------------------------------------------------------------------------
  // Content rendering
  // ---------------------------------------------------------------------------
  it('renders the game name as title', () => {
    render(
      <GameLeaderboardPreviewCard gameId="game-1" gameName="Coin Flip" entries={mockEntries} />
    );
    expect(screen.getByText('Coin Flip')).toBeInTheDocument();
  });

  it('renders truncated game ID', () => {
    render(
      <GameLeaderboardPreviewCard gameId="game-1234567890" gameName="Coin Flip" entries={mockEntries} />
    );
    const gameIdEl = screen.getByText(/#game-12/);
    expect(gameIdEl).toBeInTheDocument();
  });

  it('renders up to 5 leaderboard entries', () => {
    render(
      <GameLeaderboardPreviewCard gameId="game-1" gameName="Coin Flip" entries={mockEntries} />
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('Diana')).toBeInTheDocument();
    expect(screen.getByText('Eve')).toBeInTheDocument();
  });

  it('renders rank badges for each entry', () => {
    render(
      <GameLeaderboardPreviewCard gameId="game-1" gameName="Coin Flip" entries={mockEntries} />
    );
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
  });

  it('formats large scores with K suffix', () => {
    render(
      <GameLeaderboardPreviewCard gameId="game-1" gameName="Coin Flip" entries={mockEntries} />
    );
    expect(screen.getByText('9.5K')).toBeInTheDocument();
    expect(screen.getByText('8.2K')).toBeInTheDocument();
  });

  it('formats small scores without suffix', () => {
    const smallEntries: LeaderboardEntry[] = [
      { rank: 1, playerName: 'Alice', score: 100 },
    ];
    render(
      <GameLeaderboardPreviewCard gameId="game-1" gameName="Coin Flip" entries={smallEntries} />
    );
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('formats million scores with M suffix', () => {
    const millionEntries: LeaderboardEntry[] = [
      { rank: 1, playerName: 'Alice', score: 1_500_000 },
    ];
    render(
      <GameLeaderboardPreviewCard gameId="game-1" gameName="Coin Flip" entries={millionEntries} />
    );
    expect(screen.getByText('1.5M')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Footer info
  // ---------------------------------------------------------------------------
  it('renders total players count when provided', () => {
    render(
      <GameLeaderboardPreviewCard
        gameId="game-1"
        gameName="Coin Flip"
        entries={mockEntries}
        totalPlayers={150}
      />
    );
    expect(screen.getByText('150 total players')).toBeInTheDocument();
  });

  it('renders last updated time when provided', () => {
    render(
      <GameLeaderboardPreviewCard
        gameId="game-1"
        gameName="Coin Flip"
        entries={mockEntries}
        lastUpdated="2 min ago"
      />
    );
    expect(screen.getByText('Updated 2 min ago')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Accessibility
  // ---------------------------------------------------------------------------
  it('list has aria-label with game name', () => {
    render(
      <GameLeaderboardPreviewCard gameId="game-1" gameName="Coin Flip" entries={mockEntries} />
    );
    const list = screen.getByRole('list');
    expect(list).toHaveAttribute('aria-label', 'Coin Flip top players');
  });

  it('each entry has descriptive aria-label', () => {
    render(
      <GameLeaderboardPreviewCard gameId="game-1" gameName="Coin Flip" entries={mockEntries} />
    );
    const firstEntry = screen.getByTestId('game-leaderboard-preview-entry-1');
    expect(firstEntry.getAttribute('aria-label')).toContain('Rank 1');
    expect(firstEntry.getAttribute('aria-label')).toContain('Alice');
  });

  it('avatar placeholder shows initials', () => {
    render(
      <GameLeaderboardPreviewCard gameId="game-1" gameName="Coin Flip" entries={mockEntries} />
    );
    const placeholders = screen.getAllByText(/Al/);
    expect(placeholders.length).toBeGreaterThan(0);
  });

  it('renders avatar image when avatarUrl is provided', () => {
    const entriesWithAvatar: LeaderboardEntry[] = [
      { rank: 1, playerName: 'Alice', score: 100, avatarUrl: 'https://example.com/alice.jpg' },
    ];
    render(
      <GameLeaderboardPreviewCard gameId="game-1" gameName="Coin Flip" entries={entriesWithAvatar} />
    );
    const imgContainer = screen.getByTestId('game-leaderboard-preview-entry-1');
    const img = imgContainer.querySelector('img');
    expect(img).toHaveAttribute('src', 'https://example.com/alice.jpg');
  });
});
