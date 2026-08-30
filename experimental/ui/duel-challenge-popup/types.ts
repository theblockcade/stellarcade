export type DuelStatus = "pending" | "accepted" | "declined" | "expired";

export interface DuelChallenger {
  username: string;
  avatarUrl?: string;
  winRate?: number;
  level?: number;
}

export interface DuelChallengePopupProps {
  challenger: DuelChallenger;
  gameTitle: string;
  stakeAmountXlm?: number;
  expiresInSeconds?: number;
  status?: DuelStatus;
  onAccept: () => void;
  onDecline: () => void;
  onClose?: () => void;
}
