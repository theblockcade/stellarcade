export type SlotSymbol =
  | "star"
  | "diamond"
  | "coin"
  | "crown"
  | "bell"
  | "seven"
  | "bar"
  | "cherry";

export type SlotState = "idle" | "spinning" | "stopping" | "resolved";

export interface SlotReelProps {
  symbols: SlotSymbol[];
  isSpinning: boolean;
  landedSymbol?: SlotSymbol;
  reelIndex: number;
  stopDelayMs?: number;
}

export interface SlotMachineReelsProps {
  reels: SlotSymbol[][];
  gameState: SlotState;
  winningLine?: SlotSymbol | null;
  betAmountXlm?: number;
  jackpot?: number;
  onSpin: () => void;
  onBetChange?: (amount: number) => void;
  payoutMultipliers?: Partial<Record<SlotSymbol, number>>;
}

export interface WinBannerProps {
  symbol: SlotSymbol;
  multiplier?: number;
  betAmountXlm?: number;
}
