import React from 'react';
import './RelatedWalletQuickLinks.css';

export type WalletRelationship = 'signer' | 'sponsor' | 'counterparty' | 'multisig-member';

export interface RelatedWallet {
  id: string;
  address: string;
  label?: string;
  relationship: WalletRelationship;
  txCount?: number;
  lastActiveAt?: number;
  href?: string;
}

export interface RelatedWalletQuickLinksProps {
  wallets: RelatedWallet[];
  activeWalletId?: string;
  onSelect?: (walletId: string) => void;
  layout?: 'horizontal' | 'vertical' | 'grid';
  compact?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  testId?: string;
}

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const RELATIONSHIP_LABELS: Record<WalletRelationship, string> = {
  signer: 'Signer',
  sponsor: 'Sponsor',
  counterparty: 'Counterparty',
  'multisig-member': 'Multisig',
};

export const RelatedWalletQuickLinks: React.FC<RelatedWalletQuickLinksProps> = ({
  wallets,
  activeWalletId,
  onSelect,
  layout = 'horizontal',
  compact = false,
  loading = false,
  emptyMessage = 'No related wallets found',
  className = '',
  testId = 'related-wallet-quick-links',
}) => {
  const containerClasses = [
    'related-wallet-links',
    `related-wallet-links--${layout}`,
    compact ? 'related-wallet-links--compact' : '',
    className,
  ].filter(Boolean).join(' ');

  if (loading) {
    return (
      <div className={containerClasses} data-testid={`${testId}-loading`} role="status" aria-live="polite">
        <div className="related-wallet-links__loading">
          <div className="related-wallet-links__skeleton" />
          <div className="related-wallet-links__skeleton" />
          <div className="related-wallet-links__skeleton" />
        </div>
      </div>
    );
  }

  if (wallets.length === 0) {
    return (
      <div className="related-wallet-links__empty" data-testid={`${testId}-empty`} role="status">
        <span className="related-wallet-links__empty-message">{emptyMessage}</span>
      </div>
    );
  }

  const handleClick = (wallet: RelatedWallet) => {
    if (onSelect) {
      onSelect(wallet.id);
    }
  };

  return (
    <nav className={containerClasses} data-testid={testId} aria-label="Related wallets">
      <ul className="related-wallet-links__list" role="list">
        {wallets.map((wallet) => {
          const isActive = activeWalletId === wallet.id;
          const displayLabel = wallet.label || truncateAddress(wallet.address);

          const linkClasses = [
            'related-wallet-links__item',
            isActive ? 'related-wallet-links__item--active' : '',
          ].filter(Boolean).join(' ');

          const content = (
            <>
              <span className="related-wallet-links__address" title={wallet.address}>
                {displayLabel}
              </span>
              <span className="related-wallet-links__relationship">
                {RELATIONSHIP_LABELS[wallet.relationship]}
              </span>
              {wallet.txCount !== undefined && (
                <span className="related-wallet-links__badge" aria-label={`${wallet.txCount} transactions`}>
                  {wallet.txCount}
                </span>
              )}
            </>
          );

          return (
            <li key={wallet.id} className="related-wallet-links__list-item">
              {wallet.href ? (
                <a
                  href={wallet.href}
                  className={linkClasses}
                  onClick={() => handleClick(wallet)}
                  aria-current={isActive ? 'page' : undefined}
                  data-testid={`${testId}-wallet-${wallet.id}`}
                >
                  {content}
                </a>
              ) : (
                <button
                  type="button"
                  className={linkClasses}
                  onClick={() => handleClick(wallet)}
                  aria-current={isActive ? 'page' : undefined}
                  data-testid={`${testId}-wallet-${wallet.id}`}
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

RelatedWalletQuickLinks.displayName = 'RelatedWalletQuickLinks';

export default RelatedWalletQuickLinks;
