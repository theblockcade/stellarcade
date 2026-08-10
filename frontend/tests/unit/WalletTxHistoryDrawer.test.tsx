import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WalletTxHistoryDrawer } from '../../src/components/v1/WalletTxHistoryDrawer';
import type { WalletTxEntry } from '../../src/components/v1/WalletTxHistoryDrawer';

const SAMPLE_TXS: WalletTxEntry[] = [
  {
    id: 'tx-1',
    type: 'buy',
    asset: 'XLM',
    amount: '100.00',
    price: '$0.12',
    timestamp: '2024-01-15T10:30:00Z',
    status: 'confirmed',
    txHash: 'abc123def456abc123def456abc123def456',
  },
  {
    id: 'tx-2',
    type: 'sell',
    asset: 'USDC',
    amount: '50.00',
    timestamp: '2024-01-14T08:00:00Z',
    status: 'pending',
  },
  {
    id: 'tx-3',
    type: 'transfer',
    asset: 'BTC',
    amount: '0.001',
    timestamp: '2024-01-13T12:00:00Z',
    status: 'failed',
  },
];

const WALLET_ADDRESS = 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37';

describe('WalletTxHistoryDrawer', () => {
  it('is not visible when closed', () => {
    render(
      <WalletTxHistoryDrawer
        open={false}
        onClose={() => {}}
        walletAddress={WALLET_ADDRESS}
        transactions={SAMPLE_TXS}
        testId="wth-drawer"
      />,
    );
    const drawer = screen.getByTestId('wth-drawer');
    expect(drawer).not.toHaveClass('drawer--open');
  });

  it('renders open with transaction list', () => {
    render(
      <WalletTxHistoryDrawer
        open={true}
        onClose={() => {}}
        walletAddress={WALLET_ADDRESS}
        transactions={SAMPLE_TXS}
        testId="wth-drawer"
      />,
    );
    expect(screen.getByTestId('wth-drawer')).toHaveClass('drawer--open');
    expect(screen.getByTestId('wth-drawer-list')).toBeInTheDocument();
    expect(screen.getByTestId('wth-drawer-item-tx-1')).toBeInTheDocument();
    expect(screen.getByTestId('wth-drawer-item-tx-2')).toBeInTheDocument();
    expect(screen.getByTestId('wth-drawer-item-tx-3')).toBeInTheDocument();
  });

  it('shows empty state when no transactions', () => {
    render(
      <WalletTxHistoryDrawer
        open={true}
        onClose={() => {}}
        walletAddress={WALLET_ADDRESS}
        transactions={[]}
        testId="wth-drawer"
      />,
    );
    expect(screen.getByTestId('wth-drawer-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('wth-drawer-list')).not.toBeInTheDocument();
  });

  it('shows type and amount for each transaction', () => {
    render(
      <WalletTxHistoryDrawer
        open={true}
        onClose={() => {}}
        walletAddress={WALLET_ADDRESS}
        transactions={SAMPLE_TXS}
        testId="wth-drawer"
      />,
    );
    expect(screen.getByTestId('wth-drawer-item-tx-1-type')).toHaveTextContent('Buy');
    expect(screen.getByTestId('wth-drawer-item-tx-1-amount')).toHaveTextContent('100.00');
    expect(screen.getByTestId('wth-drawer-item-tx-2-type')).toHaveTextContent('Sell');
    expect(screen.getByTestId('wth-drawer-item-tx-2-amount')).toHaveTextContent('50.00');
    expect(screen.getByTestId('wth-drawer-item-tx-3-type')).toHaveTextContent('Transfer');
    expect(screen.getByTestId('wth-drawer-item-tx-3-amount')).toHaveTextContent('0.001');
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <WalletTxHistoryDrawer
        open={true}
        onClose={onClose}
        walletAddress={WALLET_ADDRESS}
        transactions={SAMPLE_TXS}
        testId="wth-drawer"
      />,
    );
    screen.getByTestId('wth-drawer-close').click();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
