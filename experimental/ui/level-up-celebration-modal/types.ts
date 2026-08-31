export interface LevelUpPerk {
  label: string;
  icon?: string;
}

export interface LevelUpCelebrationModalProps {
  isOpen: boolean;
  previousLevel: number;
  newLevel: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  unlockedPerks?: LevelUpPerk[];
  onClose: () => void;
  onShare?: (platform: 'x' | 'telegram') => void;
  autoDismissMs?: number;
}
