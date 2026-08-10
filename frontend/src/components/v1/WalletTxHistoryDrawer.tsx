import React from 'react';
import { Drawer } from './Drawer';
import './WalletTxHistoryDrawer.css';

export interface WalletTxEntry {
  id: string;
  type: 'buy' | 'sell' | 'transfer';
  asset: string;
  amount: string;
  price?: string;
  timestamp: string;
  status: 'confirmed' | 'pending' | 'failed';
  txHash?: string;
}

export interface WalletTxHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  walletAddress: string;
  transactions: WalletTxEntry[];
  testId?: string;
}

const TYPE_ICONS: Record<WalletTxEntry['type'], string> = {
  buy: '↓',
  sell: '↑',
  transfer: '⇄',
};

const TYPE_LABELS: Record<WalletTxEntry['type'], string> = {
  buy: 'Buy',
  sell: 'Sell',
  transfer: 'Transfer',
};

function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

function truncateHash(hash: string): string {
  if (hash.length <= 12) return hash;
  return `${hash.slice(0, 6)}…${hash.slice(-6)}`;
}

export const WalletTxHistoryDrawer: React.FC<WalletTxHistoryDrawerProps> = ({
  open,
  onClose,
  walletAddress,
  transactions,
  testId = 'wallet-tx-history-drawer',
}) => {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Transaction History"
      side="right"
      testId={testId}
    >
      <div className="wallet-tx-history-drawer" data-testid={`${testId}-content`}>
        <p className="wallet-tx-history-drawer__address" data-testid={`${testId}-address`}>
          {walletAddress}
        </p>

        {transactions.length === 0 ? (
          <div
            className="wallet-tx-history-drawer__empty"
            data-testid={`${testId}-empty`}
          >
            No transactions found for this wallet.
          </div>
        ) : (
          <ul className="wallet-tx-history-drawer__list" data-testid={`${testId}-list`}>
            {transactions.map((tx) => (
              <li
                key={tx.id}
                className="wallet-tx-history-drawer__item"
                data-testid={`${testId}-item-${tx.id}`}
              >
                <span
                  className={`wallet-tx-history-drawer__icon wallet-tx-history-drawer__icon--${tx.type}`}
                  aria-label={TYPE_LABELS[tx.type]}
                >
                  {TYPE_ICONS[tx.type]}
                </span>

                <div className="wallet-tx-history-drawer__details">
                  <div className="wallet-tx-history-drawer__row">
                    <span
                      className="wallet-tx-history-drawer__type"
                      data-testid={`${testId}-item-${tx.id}-type`}
                    >
                      {TYPE_LABELS[tx.type]}
                    </span>
                    <span
                      className="wallet-tx-history-drawer__asset"
                      data-testid={`${testId}-item-${tx.id}-asset`}
                    >
                      {tx.asset}
                    </span>
                  </div>

                  <div className="wallet-tx-history-drawer__row">
                    <span
                      className="wallet-tx-history-drawer__amount"
                      data-testid={`${testId}-item-${tx.id}-amount`}
                    >
                      {tx.amount}
                    </span>
                    {tx.price && (
                      <span className="wallet-tx-history-drawer__price">
                        @ {tx.price}
                      </span>
                    )}
                  </div>

                  <div className="wallet-tx-history-drawer__row wallet-tx-history-drawer__row--meta">
                    <time
                      className="wallet-tx-history-drawer__timestamp"
                      dateTime={tx.timestamp}
                    >
                      {formatTimestamp(tx.timestamp)}
                    </time>

                    {tx.txHash && (
                      <span
                        className="wallet-tx-history-drawer__hash"
                        title={tx.txHash}
                      >
                        {truncateHash(tx.txHash)}
                      </span>
                    )}
                  </div>
                </div>

                <span
                  className={`wallet-tx-history-drawer__status wallet-tx-history-drawer__status--${tx.status}`}
                  data-testid={`${testId}-item-${tx.id}-status`}
                >
                  {tx.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Drawer>
  );
};

WalletTxHistoryDrawer.displayName = 'WalletTxHistoryDrawer';

export default WalletTxHistoryDrawer;
