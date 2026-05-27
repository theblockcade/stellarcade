import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import GameDetail from '../../src/pages/GameDetail';
import { ApiClient } from '../../src/services/typed-api-sdk';

vi.mock('../../src/services/typed-api-sdk');
vi.mock('../../src/components/v1/ContractEventFeed', () => ({
  default: ({ contractId }: { contractId: string }) => (
    <div data-testid="timeline-feed">Timeline contract: {contractId}</div>
  ),
}));

function renderWithRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/games/:gameId" element={<GameDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('GameDetail', () => {
  it('renders game summary and timeline on successful fetch', async () => {
    (ApiClient as any).prototype.getGameById.mockResolvedValue({
      success: true,
      data: {
        id: 'game-42',
        name: 'Nebula Showdown',
        status: 'active',
        contractId: 'contract-nebula-42',
      },
    });

    renderWithRoute('/games/game-42');

    expect(screen.getByText(/Loading game details.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Nebula Showdown')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1, name: 'Nebula Showdown' })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Nebula Showdown' })).toBeInTheDocument();
      expect(screen.getByTestId('game-detail-status')).toHaveTextContent('Status: active');
      expect(screen.getByTestId('timeline-feed')).toHaveTextContent(
        'Timeline contract: contract-nebula-42',
      );
    });
  });

  it('renders deterministic error state when fetch fails', async () => {
    (ApiClient as any).prototype.getGameById.mockResolvedValue({
      success: false,
      error: { message: 'Backend unavailable' },
    });

    renderWithRoute('/games/game-99');

    await waitFor(() => {
      expect(screen.getByTestId('game-detail-error')).toHaveTextContent(
        'Failed to load game: Backend unavailable',
      );
    });
  });

  it('renders deterministic empty state when API returns null', async () => {
    (ApiClient as any).prototype.getGameById.mockResolvedValue({
      success: true,
      data: null,
    });

    renderWithRoute('/games/missing-game');

    await waitFor(() => {
      expect(screen.getByTestId('game-detail-empty')).toHaveTextContent(
        'No game found for id: missing-game',
      );
    });
  });
});

describe('GameDetail sidebar quick actions', () => {
  it('renders the sidebar with related-entity pivot links on successful load', async () => {
    (ApiClient as any).prototype.getGameById.mockResolvedValue({
      success: true,
      data: {
        id: 'game-55',
        name: 'Stellar Duel',
        status: 'waiting',
        contractId: 'contract-duel-55',
      },
    });

    renderWithRoute('/games/game-55');

    await waitFor(() => {
      expect(screen.getByTestId('game-detail-sidebar')).toBeInTheDocument();
      expect(screen.getByRole('complementary', { name: 'Related actions' })).toBeInTheDocument();
    });

    expect(screen.getByTestId('game-detail-pivot-links')).toBeInTheDocument();
    expect(screen.getByText('Back to Lobby')).toBeInTheDocument();
    expect(screen.getByText('Wallet Details')).toBeInTheDocument();
    expect(screen.getByText('Transaction History')).toBeInTheDocument();
    expect(screen.getByText('Audit Log')).toBeInTheDocument();
  });

  it('includes a Live Match link when the game status is active', async () => {
    (ApiClient as any).prototype.getGameById.mockResolvedValue({
      success: true,
      data: {
        id: 'game-77',
        name: 'Active Arena',
        status: 'active',
        contractId: 'contract-arena-77',
      },
    });

    renderWithRoute('/games/game-77');

    await waitFor(() => {
      expect(screen.getByTestId('game-detail-pivot-links')).toBeInTheDocument();
    });

    expect(screen.getByText('Live Match')).toBeInTheDocument();
  });

  it('does not include a Live Match link for non-active games', async () => {
    (ApiClient as any).prototype.getGameById.mockResolvedValue({
      success: true,
      data: {
        id: 'game-88',
        name: 'Completed Game',
        status: 'completed',
        contractId: 'contract-comp-88',
      },
    });

    renderWithRoute('/games/game-88');

    await waitFor(() => {
      expect(screen.getByTestId('game-detail-pivot-links')).toBeInTheDocument();
    });

    expect(screen.queryByText('Live Match')).not.toBeInTheDocument();
  });

  it('sidebar is not rendered in the loading state', () => {
    (ApiClient as any).prototype.getGameById.mockReturnValue(new Promise(() => {}));

    renderWithRoute('/games/game-loading');

    expect(screen.queryByTestId('game-detail-sidebar')).not.toBeInTheDocument();
    expect(screen.getByTestId('game-detail-loading')).toBeInTheDocument();
  });

  it('sidebar is not rendered in the error state', async () => {
    (ApiClient as any).prototype.getGameById.mockResolvedValue({
      success: false,
      error: { message: 'Not found' },
    });

    renderWithRoute('/games/bad-id');

    await waitFor(() => {
      expect(screen.getByTestId('game-detail-error')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('game-detail-sidebar')).not.toBeInTheDocument();
  });

  it('pivot links render in vertical orientation for the sidebar', async () => {
    (ApiClient as any).prototype.getGameById.mockResolvedValue({
      success: true,
      data: {
        id: 'game-99',
        name: 'Orientation Test',
        status: 'idle',
        contractId: 'contract-ot-99',
      },
    });

    renderWithRoute('/games/game-99');

    await waitFor(() => {
      expect(screen.getByTestId('game-detail-pivot-links')).toBeInTheDocument();
    });

    expect(screen.getByTestId('game-detail-pivot-links')).toHaveClass(
      'quick-pivot-links--vertical',
    );
  });
});
