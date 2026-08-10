import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LeaderboardComparer, type Player, type Metric } from '../../../src/components/v1/LeaderboardComparer';

describe('LeaderboardComparer', () => {
  const mockPlayers: Player[] = [
    {
      id: 'player-1',
      name: 'Jerome Peter',
      rank: 12,
      stats: { winRate: 68, gamesPlayed: 120, totalEarnings: 550 },
    },
    {
      id: 'player-2',
      name: 'Just James',
      rank: 45,
      stats: { winRate: 52, gamesPlayed: 240, totalEarnings: 1200 },
    },
    {
      id: 'player-3',
      name: 'Sarah Connor',
      rank: 3,
      stats: { winRate: 85, gamesPlayed: 90, totalEarnings: 950 },
    },
  ];

  const mockMetrics: Metric[] = [
    { key: 'winRate', label: 'Win Rate', format: (val) => `${val}%`, higherIsBetter: true },
    { key: 'gamesPlayed', label: 'Games Played', higherIsBetter: true },
    { key: 'totalEarnings', label: 'Total Earnings', format: (val) => `$${val}`, higherIsBetter: true },
  ];

  const defaultProps = {
    availablePlayers: mockPlayers,
    metrics: mockMetrics,
    initialPlayerAId: 'player-1',
    initialPlayerBId: 'player-2',
    onPlayerChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty panel when no players are passed', () => {
    render(<LeaderboardComparer availablePlayers={[]} metrics={mockMetrics} />);
    expect(screen.getByText('No players or metrics available to compare.')).toBeInTheDocument();
  });

  it('renders selectors, player rank badges, and stat values correctly', () => {
    render(<LeaderboardComparer {...defaultProps} />);

    // Jerome Peter and Just James are default selected
    expect(screen.getByTestId('leaderboard-comparer-rank-a')).toHaveTextContent('Rank #12');
    expect(screen.getByTestId('leaderboard-comparer-rank-b')).toHaveTextContent('Rank #45');

    // Check rendering values of stats
    // Win Rate (player A: 68%, player B: 52%)
    expect(screen.getByText('68%')).toBeInTheDocument();
    expect(screen.getByText('52%')).toBeInTheDocument();

    // Total Earnings (player A: $550, player B: $1200)
    expect(screen.getByText('$550')).toBeInTheDocument();
    expect(screen.getByText('$1200')).toBeInTheDocument();
  });

  it('swaps players when swap button is clicked', () => {
    render(<LeaderboardComparer {...defaultProps} />);
    const swapBtn = screen.getByTestId('leaderboard-comparer-swap-button');
    
    // Prior to swap
    expect(screen.getByTestId('leaderboard-comparer-select-a')).toHaveValue('player-1');
    expect(screen.getByTestId('leaderboard-comparer-select-b')).toHaveValue('player-2');

    // Click swap
    fireEvent.click(swapBtn);

    // After swap
    expect(screen.getByTestId('leaderboard-comparer-select-a')).toHaveValue('player-2');
    expect(screen.getByTestId('leaderboard-comparer-select-b')).toHaveValue('player-1');
    expect(defaultProps.onPlayerChange).toHaveBeenCalledWith('A', 'player-2');
    expect(defaultProps.onPlayerChange).toHaveBeenCalledWith('B', 'player-1');
  });

  it('updates detail panel when a metric row is clicked', () => {
    render(<LeaderboardComparer {...defaultProps} />);

    // Default active metric details (first metric 'winRate')
    expect(screen.getByText('Detail Analysis: Win Rate')).toBeInTheDocument();

    // Click on 'Total Earnings' row
    const earningsRow = screen.getByTestId('leaderboard-comparer-metric-row-totalEarnings');
    fireEvent.click(earningsRow);

    // Verify detail panel updates
    expect(screen.getByText('Detail Analysis: Total Earnings')).toBeInTheDocument();
  });

  it('triggers onPlayerChange callback when selecting a different player', () => {
    render(<LeaderboardComparer {...defaultProps} />);
    const selectA = screen.getByTestId('leaderboard-comparer-select-a');

    // Select Player 3 (Sarah Connor)
    fireEvent.change(selectA, { target: { value: 'player-3' } });

    expect(defaultProps.onPlayerChange).toHaveBeenCalledWith('A', 'player-3');
    expect(screen.getByTestId('leaderboard-comparer-rank-a')).toHaveTextContent('Rank #3');
  });
});
