export interface PlayerHudData {
  name: string;
  score: number;
  isCurrentTurn?: boolean;
}

export type ReactionEmoji = '🔥' | '👏' | '🎯' | '💀';

export const REACTION_EMOJIS: ReactionEmoji[] = ['🔥', '👏', '🎯', '💀'];

/** Seconds remaining at or below this threshold triggers the pulsing red
 * "urgent" state on the countdown circle. */
export const URGENT_THRESHOLD_SECONDS = 5;

export interface GameHudOverlayProps {
  p1: PlayerHudData;
  p2: PlayerHudData;
  secondsRemaining: number;
  wagerAmount: number;
  onSendReaction: (emoji: ReactionEmoji) => void;
  onSurrender: () => void;
}

export interface TimerCountdownCircleProps {
  secondsRemaining: number;
  totalSeconds: number;
}
