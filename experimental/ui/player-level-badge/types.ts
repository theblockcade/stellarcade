export type PlayerTier = 'Bronze' | 'Silver' | 'Gold' | 'Diamond';

export type PlayerLevelBadgeSize = 'sm' | 'md' | 'lg';

export interface PlayerLevelBadgeProps {
  currentXp: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  level: number;
  size?: PlayerLevelBadgeSize;
}
