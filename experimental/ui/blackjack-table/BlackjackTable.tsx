import React, { useMemo } from "react";
import type { BlackjackTableProps, Card, Rank } from "./types";
import { PlayingCard } from "./PlayingCard";

const RANK_VALUES: Record<Rank, number> = {
  A: 11, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7,
  "8": 8, "9": 9, "10": 10, J: 10, Q: 10, K: 10,
};

export function computeHandValue(hand: Card[]): number {
  const visible = hand.filter((c) => !c.faceDown);
  let total = 0;
  let aces = 0;
  for (const card of visible) {
    total += RANK_VALUES[card.rank];
    if (card.rank === "A") aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

export function formatHandValue(hand: Card[]): string {
  const visible = hand.filter((c) => !c.faceDown);
  let total = 0;
  let aces = 0;
  for (const card of visible) {
    total += RANK_VALUES[card.rank];
    if (card.rank === "A") aces++;
  }
  if (aces > 0 && total <= 21) {
    const soft = total;
    const hard = total - 10 * aces + (aces > 0 ? 0 : 0);
    const hardVal = soft > 21 ? soft - 10 : soft;
    const altVal = hardVal - 10;
    if (altVal > 0 && altVal !== hardVal && hardVal <= 21) {
      return `${altVal} / ${hardVal}`;
    }
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return String(total);
}

const OUTCOME_LABELS: Record<string, string> = {
  blackjack: "Blackjack! 🎉",
  win: "You Win! 🏆",
  lose: "Dealer Wins",
  push: "Push",
  dealer_bust: "Dealer Busts! 🎉",
};

export const BlackjackTable: React.FC<BlackjackTableProps> = ({
  playerHand,
  dealerHand,
  gameState,
  outcome = null,
  betAmountXlm,
  onHit,
  onStand,
  onDoubleDown,
  onSplit,
  onNewGame,
}) => {
  const playerValue = useMemo(() => computeHandValue(playerHand), [playerHand]);
  const playerBust = playerValue > 21;
  const isPlayerTurn = gameState === "player_turn";
  const isResolved = gameState === "resolved";
  const actionsDisabled = !isPlayerTurn || playerBust;

  const canSplit =
    isPlayerTurn &&
    playerHand.length === 2 &&
    playerHand[0].rank === playerHand[1].rank;

  return (
    <div className="blackjack-table" data-testid="blackjack-table">
      {/* Felt surface */}
      <div className="blackjack-felt" aria-label="Blackjack table">

        {/* Dealer area */}
        <section className="blackjack-area blackjack-area--dealer" aria-label="Dealer hand">
          <span className="blackjack-area__label">Dealer</span>
          <div className="blackjack-cards" data-testid="dealer-cards">
            {dealerHand.map((card, i) => (
              <PlayingCard key={i} card={card} dealIndex={i} />
            ))}
          </div>
          <span
            className="blackjack-score-badge"
            data-testid="dealer-score"
            aria-label={`Dealer score: ${formatHandValue(dealerHand)}`}
          >
            {formatHandValue(dealerHand)}
          </span>
        </section>

        {/* Outcome banner */}
        {isResolved && outcome && (
          <div
            className={`blackjack-outcome blackjack-outcome--${outcome}`}
            data-testid="outcome-banner"
            role="status"
            aria-live="polite"
          >
            {OUTCOME_LABELS[outcome] ?? outcome}
          </div>
        )}

        {/* Player area */}
        <section className="blackjack-area blackjack-area--player" aria-label="Player hand">
          <div className="blackjack-cards" data-testid="player-cards">
            {playerHand.map((card, i) => (
              <PlayingCard key={i} card={card} dealIndex={i} />
            ))}
          </div>
          <span
            className="blackjack-score-badge"
            data-testid="player-score"
            aria-label={`Player score: ${formatHandValue(playerHand)}`}
          >
            {formatHandValue(playerHand)}
          </span>
          {playerBust && (
            <span className="blackjack-bust-badge" data-testid="bust-label" role="alert">
              Bust!
            </span>
          )}
          <span className="blackjack-area__label">
            {betAmountXlm !== undefined ? `Bet: ${betAmountXlm} XLM` : "Player"}
          </span>
        </section>
      </div>

      {/* Action buttons */}
      <div className="blackjack-actions" role="group" aria-label="Player actions">
        <button
          className="blackjack-btn blackjack-btn--hit"
          onClick={onHit}
          disabled={actionsDisabled}
          data-testid="btn-hit"
          aria-label="Hit"
        >
          Hit
        </button>
        <button
          className="blackjack-btn blackjack-btn--stand"
          onClick={onStand}
          disabled={actionsDisabled}
          data-testid="btn-stand"
          aria-label="Stand"
        >
          Stand
        </button>
        <button
          className="blackjack-btn blackjack-btn--double"
          onClick={onDoubleDown}
          disabled={actionsDisabled}
          data-testid="btn-double"
          aria-label="Double Down"
        >
          Double Down
        </button>
        {onSplit && (
          <button
            className="blackjack-btn blackjack-btn--split"
            onClick={onSplit}
            disabled={!canSplit}
            data-testid="btn-split"
            aria-label="Split"
          >
            Split
          </button>
        )}
        {isResolved && onNewGame && (
          <button
            className="blackjack-btn blackjack-btn--new-game"
            onClick={onNewGame}
            data-testid="btn-new-game"
            aria-label="New Game"
          >
            New Game
          </button>
        )}
      </div>
    </div>
  );
};
