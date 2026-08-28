export type CrateState = 'idle' | 'opening' | 'opened';

export type RewardRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type RewardKind = 'xp' | 'xlm' | 'nft_badge';

export interface UnboxedReward {
  kind: RewardKind;
  rarity: RewardRarity;
  amount?: number;
  badgeName?: string;
}

export interface MysteryCrateUnboxingProps {
  isOpen: boolean;
  reward?: UnboxedReward;
  onOpenCrate: () => Promise<void>;
  onClaim: () => void;
  onClose: () => void;
}
