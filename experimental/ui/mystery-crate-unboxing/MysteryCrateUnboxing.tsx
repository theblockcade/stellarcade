import React, { useEffect, useState } from 'react';
import { CrateState, MysteryCrateUnboxingProps, RewardKind } from './types';
import { CrateCanvas } from './CrateCanvas';

const REWARD_KIND_LABEL: Record<RewardKind, string> = {
  xp: 'XP',
  xlm: 'XLM',
  nft_badge: 'NFT Badge',
};

export function formatRewardValue(kind: RewardKind, amount?: number, badgeName?: string): string {
  if (kind === 'nft_badge') {
    return badgeName ?? 'Unknown Badge';
  }
  return `${amount ?? 0} ${REWARD_KIND_LABEL[kind]}`;
}

export const MysteryCrateUnboxing: React.FC<MysteryCrateUnboxingProps> = ({
  isOpen,
  reward,
  onOpenCrate,
  onClaim,
  onClose,
}) => {
  const [crateState, setCrateState] = useState<CrateState>('idle');

  // Reset to idle whenever the overlay is (re)opened for a fresh crate.
  useEffect(() => {
    if (isOpen) {
      setCrateState('idle');
    }
  }, [isOpen]);

  // Once the reward arrives while we're mid-animation, transition to opened.
  useEffect(() => {
    if (crateState === 'opening' && reward) {
      setCrateState('opened');
    }
  }, [crateState, reward]);

  if (!isOpen) return null;

  const handleOpen = async () => {
    if (crateState !== 'idle') return;
    setCrateState('opening');
    await onOpenCrate();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && crateState === 'idle') {
      e.preventDefault();
      void handleOpen();
    }
  };

  const handleOpenAnother = () => {
    setCrateState('idle');
  };

  return (
    <div className="mystery-crate-unboxing" data-testid="mystery-crate-unboxing">
      <button
        className="mystery-crate-close-btn"
        onClick={onClose}
        aria-label="Close"
        data-testid="mystery-crate-close-btn"
      >
        ✕
      </button>

      <div
        className="mystery-crate-trigger"
        role="button"
        tabIndex={0}
        aria-label="Open mystery crate"
        onClick={handleOpen}
        onKeyDown={handleKeyDown}
        data-testid="mystery-crate-trigger"
      >
        <CrateCanvas state={crateState} rarity={reward?.rarity} />
        {crateState === 'idle' && (
          <p className="crate-idle-prompt" data-testid="crate-idle-prompt">
            Tap to open!
          </p>
        )}
      </div>

      {crateState === 'opened' && reward && (
        <div
          className={`reward-summary-card reward-summary-card--${reward.rarity}`}
          data-testid="reward-summary-card"
        >
          <p className="reward-rarity-label" data-testid="reward-rarity-label">
            {reward.rarity.toUpperCase()}
          </p>
          <p className="reward-value" data-testid="reward-value">
            {formatRewardValue(reward.kind, reward.amount, reward.badgeName)}
          </p>

          <div className="reward-summary-actions">
            <button className="btn-claim-reward" onClick={onClaim} data-testid="claim-reward-btn">
              Claim Reward
            </button>
            <button
              className="btn-open-another"
              onClick={handleOpenAnother}
              data-testid="open-another-btn"
            >
              Open Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
