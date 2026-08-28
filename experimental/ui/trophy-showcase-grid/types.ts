export type TrophyRarity = "bronze" | "silver" | "gold" | "diamond";
export type TrophyUnlockStatus = "unlocked" | "in_progress" | "locked";

export interface TrophyItem {
  id: string;
  title: string;
  description: string;
  rarity: TrophyRarity;
  status: TrophyUnlockStatus;
  unlockDate?: string;
  rewardXp: number;
  /** Current / target for an in-progress trophy (e.g. 7 of 10 matches won). */
  progress?: { current: number; target: number };
}

export type TrophyFilter = "all" | TrophyUnlockStatus;

export interface TrophyShowcaseGridProps {
  trophies: TrophyItem[];
  onSelectTrophy?: (trophy: TrophyItem) => void;
  columns?: 3 | 4 | 5;
}

export interface TrophyCardProps {
  trophy: TrophyItem;
  onSelect?: (trophy: TrophyItem) => void;
}
