/**
 * Quest and Milestone type definitions for StellarCade learning and quest system.
 */

export interface QuestMilestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  xpReward?: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  milestones: QuestMilestone[];
  enrolled: boolean;
  totalXpReward?: number;
  certificateId?: string;
  category?: "beginner" | "intermediate" | "advanced";
  estimatedTime?: string;
}

export interface QuestProgress {
  completedMilestones: number;
  totalMilestones: number;
  percentage: number;
  isComplete: boolean;
}

export interface QuestCardProps {
  quest: Quest;
  onEnroll?: () => void;
  onViewDetails?: () => void;
  onClaimCertificate?: () => void;
  showProgress?: boolean;
  compact?: boolean;
}

export interface QuestProgressBarProps {
  percentage: number;
  label?: string;
  animate?: boolean;
  animationDuration?: number;
  size?: "small" | "medium" | "large";
}

export interface QuestProgressRingProps {
  percentage: number;
  size?: "small" | "medium" | "large" | number;
  strokeWidth?: number;
  showPercentage?: boolean;
  animate?: boolean;
  animationDuration?: number;
  color?: "primary" | "success" | "warning";
  label?: string;
  subtitle?: string;
}

export interface QuestWorkspaceHeaderProps {
  activeQuest: Quest | null;
  progress: QuestProgress | null;
  onClaimCertificate?: () => void;
  onBack?: () => void;
}
