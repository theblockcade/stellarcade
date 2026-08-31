import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { SlotMachineReels } from "./SlotMachineReels";
import type { SlotState, SlotSymbol } from "./types";

afterEach(() => cleanup());

const SYMBOLS: SlotSymbol[] = ["cherry", "coin", "bell"];
const THREE_REELS = [SYMBOLS, SYMBOLS, SYMBOLS];

function makeProps(overrides: Partial<React.ComponentProps<typeof SlotMachineReels>> = {}) {
  return {
    reels: THREE_REELS,
    gameState: "idle" as SlotState,
    onSpin: vi.fn(),
    ...overrides,
  };
}

describe("SlotMachineReels", () => {
  it("renders reels container with one column per reel", () => {
    render(<SlotMachineReels {...makeProps()} />);
    expect(screen.getByTestId("reels-container")).toBeTruthy();
    expect(screen.getByTestId("reel-column-0")).toBeTruthy();
    expect(screen.getByTestId("reel-column-1")).toBeTruthy();
    expect(screen.getByTestId("reel-column-2")).toBeTruthy();
  });

  it("renders spin button in idle state", () => {
    render(<SlotMachineReels {...makeProps()} />);
    const btn = screen.getByTestId("btn-spin");
    expect(btn.textContent).toBe("Spin");
    expect(btn).not.toBeDisabled();
  });

  it("calls onSpin when Spin button is clicked", () => {
    const onSpin = vi.fn();
    render(<SlotMachineReels {...makeProps({ onSpin })} />);
    fireEvent.click(screen.getByTestId("btn-spin"));
    expect(onSpin).toHaveBeenCalledTimes(1);
  });

  it("disables spin button while spinning", () => {
    render(<SlotMachineReels {...makeProps({ gameState: "spinning" })} />);
    expect(screen.getByTestId("btn-spin")).toBeDisabled();
  });

  it("shows win banner when resolved with winning line", () => {
    render(
      <SlotMachineReels
        {...makeProps({ gameState: "resolved", winningLine: "diamond" })}
      />
    );
    expect(screen.getByTestId("win-banner")).toBeTruthy();
    expect(screen.getByTestId("winning-symbol").textContent).toBe("diamond");
  });

  it("does not show win banner without winning line", () => {
    render(<SlotMachineReels {...makeProps({ gameState: "resolved" })} />);
    expect(screen.queryByTestId("win-banner")).toBeNull();
  });

  it("shows win amount when betAmountXlm and winning line both set", () => {
    render(
      <SlotMachineReels
        {...makeProps({
          gameState: "resolved",
          winningLine: "coin",
          betAmountXlm: 10,
          payoutMultipliers: { coin: 3 },
        })}
      />
    );
    const amountEl = screen.getByTestId("win-amount");
    expect(amountEl.textContent).toContain("30");
  });

  it("renders jackpot display when jackpot provided", () => {
    render(<SlotMachineReels {...makeProps({ jackpot: 500 })} />);
    expect(screen.getByTestId("jackpot-display")).toBeTruthy();
    expect(screen.getByTestId("jackpot-amount").textContent).toContain("500");
  });

  it("renders bet controls when betAmountXlm and onBetChange provided", () => {
    render(
      <SlotMachineReels
        {...makeProps({ betAmountXlm: 5, onBetChange: vi.fn() })}
      />
    );
    expect(screen.getByTestId("bet-controls")).toBeTruthy();
    expect(screen.getByTestId("bet-amount").textContent).toContain("5");
  });

  it("calls onBetChange with incremented value on bet-up click", () => {
    const onBetChange = vi.fn();
    render(
      <SlotMachineReels
        {...makeProps({ betAmountXlm: 5, onBetChange })}
      />
    );
    fireEvent.click(screen.getByTestId("btn-bet-up"));
    expect(onBetChange).toHaveBeenCalledWith(6);
  });

  it("calls onBetChange with decremented value on bet-down click", () => {
    const onBetChange = vi.fn();
    render(
      <SlotMachineReels
        {...makeProps({ betAmountXlm: 5, onBetChange })}
      />
    );
    fireEvent.click(screen.getByTestId("btn-bet-down"));
    expect(onBetChange).toHaveBeenCalledWith(4);
  });

  it("disables bet-down at minimum bet of 1", () => {
    render(
      <SlotMachineReels
        {...makeProps({ betAmountXlm: 1, onBetChange: vi.fn() })}
      />
    );
    expect(screen.getByTestId("btn-bet-down")).toBeDisabled();
  });
});
