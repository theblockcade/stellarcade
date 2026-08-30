import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { BlackjackTable, computeHandValue, formatHandValue } from "./BlackjackTable";
import type { Card, BlackjackState } from "./types";

afterEach(() => cleanup());

const ACE_SPADES: Card = { suit: "spades", rank: "A" };
const KING_HEARTS: Card = { suit: "hearts", rank: "K" };
const SEVEN_CLUBS: Card = { suit: "clubs", rank: "7" };
const FIVE_DIAMONDS: Card = { suit: "diamonds", rank: "5" };
const HOLE: Card = { suit: "spades", rank: "2", faceDown: true };

function makeProps(overrides: Partial<React.ComponentProps<typeof BlackjackTable>> = {}) {
  return {
    playerHand: [KING_HEARTS, SEVEN_CLUBS],
    dealerHand: [ACE_SPADES, HOLE],
    gameState: "player_turn" as BlackjackState,
    onHit: vi.fn(),
    onStand: vi.fn(),
    onDoubleDown: vi.fn(),
    ...overrides,
  };
}

// ── computeHandValue ─────────────────────────────────────────────────────────

describe("computeHandValue", () => {
  it("sums numeric cards", () => {
    expect(computeHandValue([SEVEN_CLUBS, FIVE_DIAMONDS])).toBe(12);
  });

  it("counts face cards as 10", () => {
    expect(computeHandValue([KING_HEARTS, FIVE_DIAMONDS])).toBe(15);
  });

  it("counts Ace as 11 without bust", () => {
    expect(computeHandValue([ACE_SPADES, SEVEN_CLUBS])).toBe(18);
  });

  it("reduces Ace to 1 to prevent bust", () => {
    const hand: Card[] = [ACE_SPADES, KING_HEARTS, SEVEN_CLUBS];
    expect(computeHandValue(hand)).toBe(18);
  });

  it("detects bust when over 21", () => {
    const hand: Card[] = [KING_HEARTS, SEVEN_CLUBS, FIVE_DIAMONDS];
    expect(computeHandValue(hand)).toBe(22);
  });

  it("ignores face-down cards", () => {
    expect(computeHandValue([KING_HEARTS, HOLE])).toBe(10);
  });
});

// ── BlackjackTable rendering ──────────────────────────────────────────────────

describe("BlackjackTable", () => {
  it("renders dealer and player card areas", () => {
    render(<BlackjackTable {...makeProps()} />);
    expect(screen.getByTestId("dealer-cards")).toBeTruthy();
    expect(screen.getByTestId("player-cards")).toBeTruthy();
  });

  it("shows player score badge", () => {
    render(<BlackjackTable {...makeProps()} />);
    const badge = screen.getByTestId("player-score");
    expect(badge.textContent).toBe("17");
  });

  it("shows dealer score for visible cards only (ignores face-down)", () => {
    render(<BlackjackTable {...makeProps()} />);
    const badge = screen.getByTestId("dealer-score");
    expect(badge.textContent).toBe("11");
  });

  it("renders face-down card with aria-label", () => {
    render(<BlackjackTable {...makeProps()} />);
    const faceDown = screen.getAllByTestId("playing-card-face-down");
    expect(faceDown.length).toBeGreaterThan(0);
  });

  it("calls onHit when Hit button is clicked", () => {
    const onHit = vi.fn();
    render(<BlackjackTable {...makeProps({ onHit })} />);
    fireEvent.click(screen.getByTestId("btn-hit"));
    expect(onHit).toHaveBeenCalledTimes(1);
  });

  it("calls onStand when Stand button is clicked", () => {
    const onStand = vi.fn();
    render(<BlackjackTable {...makeProps({ onStand })} />);
    fireEvent.click(screen.getByTestId("btn-stand"));
    expect(onStand).toHaveBeenCalledTimes(1);
  });

  it("calls onDoubleDown when Double Down is clicked", () => {
    const onDoubleDown = vi.fn();
    render(<BlackjackTable {...makeProps({ onDoubleDown })} />);
    fireEvent.click(screen.getByTestId("btn-double"));
    expect(onDoubleDown).toHaveBeenCalledTimes(1);
  });

  it("disables Hit button when player busts", () => {
    const bustHand: Card[] = [KING_HEARTS, SEVEN_CLUBS, FIVE_DIAMONDS];
    render(<BlackjackTable {...makeProps({ playerHand: bustHand })} />);
    expect(screen.getByTestId("btn-hit")).toBeDisabled();
    expect(screen.getByTestId("bust-label")).toBeTruthy();
  });

  it("disables action buttons when gameState is not player_turn", () => {
    render(<BlackjackTable {...makeProps({ gameState: "dealer_turn" })} />);
    expect(screen.getByTestId("btn-hit")).toBeDisabled();
    expect(screen.getByTestId("btn-stand")).toBeDisabled();
  });

  it("shows outcome banner when resolved", () => {
    render(
      <BlackjackTable
        {...makeProps({ gameState: "resolved", outcome: "blackjack" })}
      />
    );
    expect(screen.getByTestId("outcome-banner").textContent).toContain("Blackjack");
  });

  it("shows New Game button when resolved and onNewGame provided", () => {
    const onNewGame = vi.fn();
    render(
      <BlackjackTable
        {...makeProps({ gameState: "resolved", outcome: "win", onNewGame })}
      />
    );
    fireEvent.click(screen.getByTestId("btn-new-game"));
    expect(onNewGame).toHaveBeenCalledTimes(1);
  });

  it("renders bet amount when betAmountXlm is provided", () => {
    render(<BlackjackTable {...makeProps({ betAmountXlm: 50 })} />);
    expect(screen.getByText(/50 XLM/)).toBeTruthy();
  });
});
