'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ItemInspectModalProps, TabType, RarityTier } from './types';
import { TiltCard } from './TiltCard';
import './ItemInspectModal.css';

const RARITY_COLORS: Record<RarityTier, { bg: string; border: string; text: string; glow: string }> = {
  Common: { bg: '#9ca3af', border: '#6b7280', text: '#1f2937', glow: 'rgba(156, 163, 175, 0.5)' },
  Rare: { bg: '#3b82f6', border: '#2563eb', text: '#ffffff', glow: 'rgba(59, 130, 246, 0.5)' },
  Epic: { bg: '#8b5cf6', border: '#7c3aed', text: '#ffffff', glow: 'rgba(139, 92, 246, 0.5)' },
  Legendary: { bg: '#f59e0b', border: '#d97706', text: '#ffffff', glow: 'rgba(245, 158, 11, 0.5)' },
};

const TABS: { id: TabType; label: string }[] = [
  { id: 'traits', label: 'Traits & Stats' },
  { id: 'lore', label: 'Lore & Description' },
  { id: 'onchain', label: 'On-Chain Proof' },
];

export const ItemInspectModal: React.FC<ItemInspectModalProps> = ({
  isOpen,
  item,
  onClose,
  onEquip,
  className = '',
  testId = 'item-inspect-modal',
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('traits');
  const [previousActiveElement, setPreviousActiveElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPreviousActiveElement(document.activeElement as HTMLElement);
    } else if (previousActiveElement) {
      previousActiveElement.focus();
    }
  }, [isOpen, previousActiveElement]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleEquip = useCallback(() => {
    if (onEquip) {
      onEquip(item.id);
    }
  }, [item.id, onEquip]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: item.name,
        text: `Check out my ${item.rarity} ${item.name} on StellarCade!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }, [item]);

  const handleViewOnExplorer = useCallback(() => {
    if (item.tokenId && item.contractAddress) {
      window.open(`https://stellar.expert/address/${item.contractAddress}`, '_blank');
    }
  }, [item]);

  const rarityStyle = RARITY_COLORS[item.rarity];

  if (!isOpen) return null;

  return (
    <div
      className={`item-inspect-modal ${className}`}
      data-testid={testId}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${testId}-title`}
    >
      <div className="item-inspect-modal__backdrop" onClick={onClose} />
      
      <div className="item-inspect-modal__content" role="document">
        <button
          className="item-inspect-modal__close"
          onClick={onClose}
          aria-label="Close modal"
          data-testid={`${testId}-close`}
        >
          ×
        </button>

        <div className="item-inspect-modal__body">
          <div className="item-inspect-modal__card-section">
            <TiltCard intensity={10} testId={`${testId}-tilt-card`}>
              <div
                className="item-inspect-modal__card"
                style={{
                  borderColor: rarityStyle.border,
                  boxShadow: `0 0 30px ${rarityStyle.glow}`,
                }}
              >
                <div
                  className="item-inspect-modal__rarity-badge"
                  style={{
                    backgroundColor: rarityStyle.bg,
                    color: rarityStyle.text,
                  }}
                >
                  {item.rarity}
                </div>
                
                <div className="item-inspect-modal__image-container">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="item-inspect-modal__image"
                  />
                  <div className="item-inspect-modal__holographic-overlay" />
                </div>

                <h2
                  id={`${testId}-title`}
                  className="item-inspect-modal__item-name"
                  style={{ color: rarityStyle.text }}
                >
                  {item.name}
                </h2>
              </div>
            </TiltCard>
          </div>

          <div className="item-inspect-modal__details-section">
            <div className="item-inspect-modal__tabs">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`item-inspect-modal__tab ${
                    activeTab === tab.id ? 'item-inspect-modal__tab--active' : ''
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                  aria-selected={activeTab === tab.id}
                  role="tab"
                  data-testid={`${testId}-tab-${tab.id}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="item-inspect-modal__tab-content">
              {activeTab === 'traits' && (
                <div className="item-inspect-modal__traits" role="tabpanel">
                  {item.traits.length === 0 ? (
                    <p className="item-inspect-modal__empty-state">No traits available</p>
                  ) : (
                    <div className="item-inspect-modal__traits-list">
                      {item.traits.map((trait, index) => (
                        <div
                          key={index}
                          className="item-inspect-modal__trait"
                          data-testid={`${testId}-trait-${index}`}
                        >
                          <span className="item-inspect-modal__trait-name">{trait.name}</span>
                          <span className="item-inspect-modal__trait-value">{trait.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'lore' && (
                <div className="item-inspect-modal__lore" role="tabpanel">
                  {item.description && (
                    <p className="item-inspect-modal__description">{item.description}</p>
                  )}
                  {item.lore && (
                    <div className="item-inspect-modal__lore-text">
                      <h4>Lore</h4>
                      <p>{item.lore}</p>
                    </div>
                  )}
                  {!item.description && !item.lore && (
                    <p className="item-inspect-modal__empty-state">No description available</p>
                  )}
                </div>
              )}

              {activeTab === 'onchain' && (
                <div className="item-inspect-modal__onchain" role="tabpanel">
                  {item.tokenId ? (
                    <div className="item-inspect-modal__onchain-info">
                      <div className="item-inspect-modal__onchain-field">
                        <span className="item-inspect-modal__onchain-label">Token ID:</span>
                        <span className="item-inspect-modal__onchain-value">{item.tokenId}</span>
                      </div>
                      {item.contractAddress && (
                        <div className="item-inspect-modal__onchain-field">
                          <span className="item-inspect-modal__onchain-label">Contract:</span>
                          <span className="item-inspect-modal__onchain-value">
                            {item.contractAddress.slice(0, 8)}...{item.contractAddress.slice(-4)}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="item-inspect-modal__empty-state">No on-chain data available</p>
                  )}
                </div>
              )}
            </div>

            <div className="item-inspect-modal__actions">
              {onEquip && (
                <button
                  className="item-inspect-modal__action-btn item-inspect-modal__action-btn--primary"
                  onClick={handleEquip}
                  style={{
                    backgroundColor: rarityStyle.bg,
                    borderColor: rarityStyle.border,
                  }}
                  data-testid={`${testId}-equip`}
                >
                  Equip as Avatar
                </button>
              )}
              
              <button
                className="item-inspect-modal__action-btn"
                onClick={handleShare}
                data-testid={`${testId}-share`}
              >
                Share Badge
              </button>
              
              {item.tokenId && item.contractAddress && (
                <button
                  className="item-inspect-modal__action-btn"
                  onClick={handleViewOnExplorer}
                  data-testid={`${testId}-explorer`}
                >
                  View on Stellar Expert
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ItemInspectModal.displayName = 'ItemInspectModal';
export default ItemInspectModal;