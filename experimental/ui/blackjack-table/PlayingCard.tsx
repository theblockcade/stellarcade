import React from "react";
import type { PlayingCardProps, Suit } from "./types";

const SUIT_SYMBOL: Record<Suit, string> = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
};

const RED_SUITS = new Set<Suit>(["hearts", "diamonds"]);

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  dealIndex = 0,
  className = "",
}) => {
  const isRed = RED_SUITS.has(card.suit);
  const delayMs = dealIndex * 150;

  if (card.faceDown) {
    return (
      <div
        className={`playing-card playing-card--face-down ${className}`}
        style={{ animationDelay: `${delayMs}ms` }}
        data-testid="playing-card-face-down"
        aria-label="Face-down card"
      >
        <div className="playing-card__back-pattern" />
      </div>
    );
  }

  const label = `${card.rank} of ${card.suit}`;

  return (
    <div
      className={`playing-card playing-card--deal-in ${isRed ? "playing-card--red" : "playing-card--black"} ${className}`}
      style={{ animationDelay: `${delayMs}ms` }}
      data-testid="playing-card"
      aria-label={label}
      role="img"
    >
      <span className="playing-card__corner playing-card__corner--top-left">
        <span className="playing-card__rank">{card.rank}</span>
        <span className="playing-card__suit">{SUIT_SYMBOL[card.suit]}</span>
      </span>
      <span className="playing-card__center-suit" aria-hidden="true">
        {SUIT_SYMBOL[card.suit]}
      </span>
      <span className="playing-card__corner playing-card__corner--bottom-right" aria-hidden="true">
        <span className="playing-card__rank">{card.rank}</span>
        <span className="playing-card__suit">{SUIT_SYMBOL[card.suit]}</span>
      </span>
    </div>
  );
};
