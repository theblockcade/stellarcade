import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RecentContractShortcutStrip, { RecentContract } from '../../src/components/RecentContractShortcutStrip';

const mockContracts: RecentContract[] = [
  {
    id: '1',
    name: 'Treasury Contract',
    type: 'Treasury',
    address: 'GABC123...XYZ789',
    lastInteraction: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    interactionCount: 15,
    isPinned: true,
    status: 'active',
    network: 'Testnet',
  },
  {
    id: '2',
    name: 'Staking Pool',
    type: 'Staking',
    address: 'GDEF456...ABC123',
    lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    interactionCount: 8,
    isPinned: false,
    status: 'active',
    network: 'Mainnet',
  },
  {
    id: '3',
    name: 'Reward Distributor',
    type: 'Rewards',
    address: 'GHIJ789...DEF456',
    lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    interactionCount: 3,
    isPinned: false,
    status: 'paused',
    network: 'Testnet',
  },
];

describe('RecentContractShortcutStrip', () => {
  const mockOnContractClick = vi.fn();
  const mockOnPinContract = vi.fn();
  const mockOnRemoveContract = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no contracts provided', () => {
    render(
      <RecentContractShortcutStrip
        contracts={[]}
        onContractClick={mockOnContractClick}
      />
    );

    expect(screen.getByText('No Recent Contracts')).toBeInTheDocument();
    expect(screen.getByText('Contracts you interact with will appear here for quick access.')).toBeInTheDocument();
  });

  it('renders contract list correctly', () => {
    render(
      <RecentContractShortcutStrip
        contracts={mockContracts}
        onContractClick={mockOnContractClick}
      />
    );

    expect(screen.getByText('Recent Contracts')).toBeInTheDocument();
    expect(screen.getByText('Treasury Contract')).toBeInTheDocument();
    expect(screen.getByText('Staking Pool')).toBeInTheDocument();
    expect(screen.getByText('Reward Distributor')).toBeInTheDocument();
  });

  it('displays contract count correctly', () => {
    render(
      <RecentContractShortcutStrip
        contracts={mockContracts}
        onContractClick={mockOnContractClick}
      />
    );

    expect(screen.getByText('(3)')).toBeInTheDocument();
  });

  it('shows pinned indicator for pinned contracts', () => {
    render(
      <RecentContractShortcutStrip
        contracts={mockContracts}
        onContractClick={mockOnContractClick}
      />
    );

    // Treasury Contract is pinned
    const treasuryCard = screen.getByText('Treasury Contract').closest('.relative');
    expect(treasuryCard?.querySelector('.fill-current')).toBeInTheDocument();
  });

  it('displays status badges with correct colors', () => {
    render(
      <RecentContractShortcutStrip
        contracts={mockContracts}
        onContractClick={mockOnContractClick}
      />
    );

    const activeStatuses = screen.getAllByText('active');
    expect(activeStatuses).toHaveLength(2);
    
    const pausedStatus = screen.getByText('paused');
    expect(pausedStatus).toBeInTheDocument();
  });

  it('formats last interaction time correctly', () => {
    render(
      <RecentContractShortcutStrip
        contracts={mockContracts}
        onContractClick={mockOnContractClick}
        showLastInteraction={true}
      />
    );

    expect(screen.getByText('30m ago')).toBeInTheDocument();
    expect(screen.getByText('2h ago')).toBeInTheDocument();
    expect(screen.getByText('1d ago')).toBeInTheDocument();
  });

  it('displays interaction count when enabled', () => {
    render(
      <RecentContractShortcutStrip
        contracts={mockContracts}
        onContractClick={mockOnContractClick}
        showInteractionCount={true}
      />
    );

    expect(screen.getByText('15 uses')).toBeInTheDocument();
    expect(screen.getByText('8 uses')).toBeInTheDocument();
    expect(screen.getByText('3 uses')).toBeInTheDocument();
  });

  it('calls onContractClick when contract card is clicked', () => {
    render(
      <RecentContractShortcutStrip
        contracts={mockContracts}
        onContractClick={mockOnContractClick}
      />
    );

    const treasuryCard = screen.getByText('Treasury Contract').closest('.cursor-pointer');
    fireEvent.click(treasuryCard!);

    expect(mockOnContractClick).toHaveBeenCalledWith(mockContracts[0]);
  });

  it('shows dropdown menu on hover and click', async () => {
    render(
      <RecentContractShortcutStrip
        contracts={mockContracts}
        onContractClick={mockOnContractClick}
        onPinContract={mockOnPinContract}
        onRemoveContract={mockOnRemoveContract}
      />
    );

    const treasuryCard = screen.getByText('Treasury Contract').closest('.group');
    const moreButton = treasuryCard?.querySelector('button');
    
    fireEvent.click(moreButton!);

    await waitFor(() => {
      expect(screen.getByText('Unpin')).toBeInTheDocument();
      expect(screen.getByText('Remove')).toBeInTheDocument();
    });
  });

  it('toggles pin status when pin button clicked', async () => {
    render(
      <RecentContractShortcutStrip
        contracts={mockContracts}
        onContractClick={mockOnContractClick}
        onPinContract={mockOnPinContract}
      />
    );

    const treasuryCard = screen.getByText('Treasury Contract').closest('.group');
    const moreButton = treasuryCard?.querySelector('button');
    
    fireEvent.click(moreButton!);

    await waitFor(() => {
      const unpinButton = screen.getByText('Unpin');
      fireEvent.click(unpinButton);
    });

    expect(mockOnPinContract).toHaveBeenCalledWith('1', false);
  });

  it('calls onRemoveContract when remove button clicked', async () => {
    render(
      <RecentContractShortcutStrip
        contracts={mockContracts}
        onContractClick={mockOnContractClick}
        onRemoveContract={mockOnRemoveContract}
      />
    );

    const treasuryCard = screen.getByText('Treasury Contract').closest('.group');
    const moreButton = treasuryCard?.querySelector('button');
    
    fireEvent.click(moreButton!);

    await waitFor(() => {
      const removeButton = screen.getByText('Remove');
      fireEvent.click(removeButton);
    });

    expect(mockOnRemoveContract).toHaveBeenCalledWith('1');
  });

  it('limits visible contracts to maxVisible', () => {
    const manyContracts = Array.from({ length: 10 }, (_, i) => ({
      ...mockContracts[0],
      id: `${i}`,
      name: `Contract ${i}`,
    }));

    render(
      <RecentContractShortcutStrip
        contracts={manyContracts}
        maxVisible={3}
        onContractClick={mockOnContractClick}
      />
    );

    expect(screen.getByText('Contract 0')).toBeInTheDocument();
    expect(screen.getByText('Contract 1')).toBeInTheDocument();
    expect(screen.getByText('Contract 2')).toBeInTheDocument();
    expect(screen.queryByText('Contract 3')).not.toBeInTheDocument();
  });

  it('shows "Show All" button when contracts exceed maxVisible', () => {
    const manyContracts = Array.from({ length: 10 }, (_, i) => ({
      ...mockContracts[0],
      id: `${i}`,
      name: `Contract ${i}`,
    }));

    render(
      <RecentContractShortcutStrip
        contracts={manyContracts}
        maxVisible={6}
        onContractClick={mockOnContractClick}
      />
    );

    expect(screen.getByText('Show All (10)')).toBeInTheDocument();
  });

  it('expands to show all contracts when "Show All" clicked', () => {
    const manyContracts = Array.from({ length: 10 }, (_, i) => ({
      ...mockContracts[0],
      id: `${i}`,
      name: `Contract ${i}`,
    }));

    render(
      <RecentContractShortcutStrip
        contracts={manyContracts}
        maxVisible={3}
        onContractClick={mockOnContractClick}
      />
    );

    const showAllButton = screen.getByText('Show All (10)');
    fireEvent.click(showAllButton);

    expect(screen.getByText('Contract 9')).toBeInTheDocument();
    expect(screen.getByText('Show Less')).toBeInTheDocument();
  });

  it('displays footer statistics correctly', () => {
    render(
      <RecentContractShortcutStrip
        contracts={mockContracts}
        onContractClick={mockOnContractClick}
      />
    );

    expect(screen.getByText('1 pinned, 2 active')).toBeInTheDocument();
  });

  it('sorts contracts with pinned first', () => {
    const { container } = render(
      <RecentContractShortcutStrip
        contracts={mockContracts}
        onContractClick={mockOnContractClick}
      />
    );

    const contractCards = container.querySelectorAll('.cursor-pointer');
    const firstCardName = contractCards[0].querySelector('h4')?.textContent;
    
    expect(firstCardName).toBe('Treasury Contract'); // Pinned contract should be first
  });

  it('hides interaction count when showInteractionCount is false', () => {
    render(
      <RecentContractShortcutStrip
        contracts={mockContracts}
        onContractClick={mockOnContractClick}
        showInteractionCount={false}
      />
    );

    expect(screen.queryByText('15 uses')).not.toBeInTheDocument();
  });

  it('hides last interaction when showLastInteraction is false', () => {
    render(
      <RecentContractShortcutStrip
        contracts={mockContracts}
        onContractClick={mockOnContractClick}
        showLastInteraction={false}
      />
    );

    expect(screen.queryByText('30m ago')).not.toBeInTheDocument();
  });

  it('displays network information correctly', () => {
    render(
      <RecentContractShortcutStrip
        contracts={mockContracts}
        onContractClick={mockOnContractClick}
      />
    );

    const testnets = screen.getAllByText('Testnet');
    expect(testnets).toHaveLength(2);
    expect(screen.getByText('Mainnet')).toBeInTheDocument();
  });
});