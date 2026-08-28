export type TickerEventType = "win" | "wager" | "jackpot";
export type TickerSpeed = "slow" | "normal" | "fast";

export interface TickerEvent {
  id: string;
  type: TickerEventType;
  gameIcon: string;
  playerHandle: string;
  actionText: string;
  amount: number;
  asset: string;
  /** True for high-value events that should pulse when they join the ticker. */
  isHighValue?: boolean;
}

export interface LiveActivityTickerProps {
  events: TickerEvent[];
  speed?: TickerSpeed;
  onSelectEvent?: (event: TickerEvent) => void;
}

export interface ActivityPillProps {
  event: TickerEvent;
  onSelect?: (event: TickerEvent) => void;
}
