export type QuestCategory = 'daily' | 'weekly' | 'milestone';

export interface QuestItem {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
  /** Steps completed toward `target`. */
  progress: number;
  /** Total steps required to complete the quest. */
  target: number;
  /** Reward label shown on the card (e.g. "500 XP", "1 Chest"). */
  reward: string;
  /** True once the reward has been claimed; a completed-but-unclaimed
   * quest has `progress >= target` and `claimed === false`. */
  claimed: boolean;
}

export interface DailyQuestCarouselProps {
  quests: QuestItem[];
  activeFilter: QuestCategory;
  onFilterChange: (category: QuestCategory) => void;
  onClaim: (questId: string) => Promise<void>;
  className?: string;
  testId?: string;
}

export interface QuestCardItemProps {
  quest: QuestItem;
  onClaim: (questId: string) => Promise<void>;
  testId?: string;
}
