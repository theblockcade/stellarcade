export type RarityTier = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export interface Trait {
  name: string;
  value: string;
  type?: string;
}

export interface CollectibleItem {
  id: string;
  name: string;
  rarity: RarityTier;
  imageUrl: string;
  traits: Trait[];
  tokenId?: string;
  description?: string;
  lore?: string;
  contractAddress?: string;
}

export interface ItemInspectModalProps {
  isOpen: boolean;
  item: CollectibleItem;
  onClose: () => void;
  onEquip?: (id: string) => void;
  className?: string;
  testId?: string;
}

export interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  testId?: string;
}

export type TabType = 'traits' | 'lore' | 'onchain';