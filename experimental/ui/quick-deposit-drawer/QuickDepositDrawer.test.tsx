import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QuickDepositDrawer, truncateAddress } from './QuickDepositDrawer';

const ADDRESS = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMNOP';

describe('truncateAddress', () => {
  it('truncates a long address to first 6 and last 4 characters', () => {
    expect(truncateAddress(ADDRESS)).toBe('GABCDE...MNOP');
  });

  it('returns short addresses unchanged', () => {
    expect(truncateAddress('GSHORT')).toBe('GSHORT');
  });
});

describe('QuickDepositDrawer', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <QuickDepositDrawer
        isOpen={false}
        onClose={vi.fn()}
        walletAddress={ADDRESS}
        currentBalance={100}
        onDeposit={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the drawer with balance and address when open', () => {
    render(
      <QuickDepositDrawer
        isOpen={true}
        onClose={vi.fn()}
        walletAddress={ADDRESS}
        currentBalance={42.5}
        onDeposit={vi.fn()}
      />
    );
    expect(screen.getByRole('dialog', { name: 'Quick deposit' })).toBeInTheDocument();
    expect(screen.getByText('42.50 XLM')).toBeInTheDocument();
  });

  it('closes on backdrop click', () => {
    const onClose = vi.fn();
    render(
      <QuickDepositDrawer
        isOpen={true}
        onClose={onClose}
        walletAddress={ADDRESS}
        currentBalance={0}
        onDeposit={vi.fn()}
      />
    );
    fireEvent.click(screen.getByTestId('qdd-backdrop'));
    expect(onClose).toHaveBeenCalled();
  });

  it('does not close when clicking inside the drawer', () => {
    const onClose = vi.fn();
    render(
      <QuickDepositDrawer
        isOpen={true}
        onClose={onClose}
        walletAddress={ADDRESS}
        currentBalance={0}
        onDeposit={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes on Escape key', () => {
    const onClose = vi.fn();
    render(
      <QuickDepositDrawer
        isOpen={true}
        onClose={onClose}
        walletAddress={ADDRESS}
        currentBalance={0}
        onDeposit={vi.fn()}
      />
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('copies the full address to the clipboard and shows a confirmation badge', async () => {
    render(
      <QuickDepositDrawer
        isOpen={true}
        onClose={vi.fn()}
        walletAddress={ADDRESS}
        currentBalance={0}
        onDeposit={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(ADDRESS);
    });
    expect(await screen.findByText('Address copied to clipboard')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument();
  });

  it('clicking a preset amount button triggers the deposit handler with that amount', async () => {
    const onDeposit = vi.fn().mockResolvedValue(undefined);
    render(
      <QuickDepositDrawer
        isOpen={true}
        onClose={vi.fn()}
        walletAddress={ADDRESS}
        currentBalance={0}
        onDeposit={onDeposit}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '25 XLM' }));

    await waitFor(() => {
      expect(onDeposit).toHaveBeenCalledWith(25);
    });
  });

  it('shows an error message when the deposit handler rejects', async () => {
    const onDeposit = vi.fn().mockRejectedValue(new Error('Insufficient balance'));
    render(
      <QuickDepositDrawer
        isOpen={true}
        onClose={vi.fn()}
        walletAddress={ADDRESS}
        currentBalance={0}
        onDeposit={onDeposit}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '10 XLM' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Insufficient balance');
  });

  it('shows the Friendbot button only on testnet with a handler provided', () => {
    const { rerender } = render(
      <QuickDepositDrawer
        isOpen={true}
        onClose={vi.fn()}
        walletAddress={ADDRESS}
        currentBalance={0}
        onDeposit={vi.fn()}
      />
    );
    expect(screen.queryByText('Fund with Testnet Friendbot')).not.toBeInTheDocument();

    rerender(
      <QuickDepositDrawer
        isOpen={true}
        onClose={vi.fn()}
        walletAddress={ADDRESS}
        currentBalance={0}
        onDeposit={vi.fn()}
        isTestnet={true}
        onFriendbotFund={vi.fn()}
      />
    );
    expect(screen.getByText('Fund with Testnet Friendbot')).toBeInTheDocument();
  });

  it('calls onFriendbotFund when the Friendbot button is clicked', async () => {
    const onFriendbotFund = vi.fn().mockResolvedValue(undefined);
    render(
      <QuickDepositDrawer
        isOpen={true}
        onClose={vi.fn()}
        walletAddress={ADDRESS}
        currentBalance={0}
        onDeposit={vi.fn()}
        isTestnet={true}
        onFriendbotFund={onFriendbotFund}
      />
    );
    fireEvent.click(screen.getByText('Fund with Testnet Friendbot'));

    await waitFor(() => {
      expect(onFriendbotFund).toHaveBeenCalled();
    });
  });
});
