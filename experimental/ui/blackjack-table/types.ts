export type Suit = "spades" | "hearts" | "diamonds" | "clubs";
export type Rank =
  | "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10"
  | "J" | "Q" | "K";

export interface Card {
  suit: Suit;
  rank: Rank;
  /** When true the card faces down (hole card). */
  faceDown?: boolean;
}

export type BlackjackState =
  | "idle"
  | "dealing"
  | "player_turn"
  | "dealer_turn"
  | "resolved";

export type BlackjackOutcome =
  | "blackjack"
  | "win"
  | "lose"
  | "push"
  | "dealer_bust"
  | null;

export interface BlackjackTableProps {
  playerHand: Card[];
  dealerHand: Card[];
  gameState: BlackjackState;
  outcome?: BlackjackOutcome;
  betAmountXlm?: number;
  onHit: () => void;
  onStand: () => void;
  onDoubleDown: () => void;
  onSplit?: () => void;
  onNewGame?: () => void;
}

export interface PlayingCardProps {
  card: Card;
  /** Index used to stagger the deal animation delay. */
  dealIndex?: number;
  className?: string;
}
