import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { WagerBetSlip, computeSingleModeSummary, computeMultiModeSummary } from "./WagerBetSlip";
import { BetSelection } from "./types";

afterEach(() => {
  cleanup();
});

function makeSelection(overrides: Partial<BetSelection> = {}): BetSelection {
  return {
    id: "sel-1",
    gameTitle: "Coinflip Streak",
    selectionLabel: "Heads",
    odds: 2,
    stake: 10,
    ...overrides,
  };
}

function renderBetSlip(overrides: Partial<React.ComponentProps<typeof WagerBetSlip>> = {}) {
  const onUpdateStake = vi.fn();
  const onRemove = vi.fn();
  const onSubmitBets = vi.fn().mockResolvedValue(undefined);
  const utils = render(
    <WagerBetSlip
      isOpen={true}
      selections={[makeSelection()]}
      availableBalance={1000}
      onUpdateStake={onUpdateStake}
      onRemove={onRemove}
      onSubmitBets={onSubmitBets}
      {...overrides}
    />,
  );
  return { ...utils, onUpdateStake, onRemove, onSubmitBets };
}

describe("computeSingleModeSummary", () => {
  it("sums each selection's own stake*odds independently", () => {
    const selections = [
      makeSelection({ id: "a", stake: 10, odds: 2 }),
      makeSelection({ id: "b", stake: 20, odds: 3 }),
    ];
    const summary = computeSingleModeSummary(selections);
    expect(summary.totalStake).toBe(30);
    expect(summary.estimatedPayout).toBe(10 * 2 + 20 * 3);
    expect(summary.potentialProfit).toBe(summary.estimatedPayout - 30);
  });

  it("returns zeros for an empty selection list", () => {
    const summary = computeSingleModeSummary([]);
    expect(summary.totalStake).toBe(0);
    expect(summary.estimatedPayout).toBe(0);
    expect(summary.potentialProfit).toBe(0);
  });
});

describe("computeMultiModeSummary", () => {
  it("multiplies odds together for a combined parlay multiplier", () => {
    const selections = [
      makeSelection({ id: "a", stake: 10, odds: 2 }),
      makeSelection({ id: "b", stake: 5, odds: 3 }),
    ];
    const summary = computeMultiModeSummary(selections);
    expect(summary.combinedOdds).toBe(6);
    expect(summary.totalStake).toBe(15);
    expect(summary.estimatedPayout).toBe(15 * 6);
  });

  it("combined odds default to 1 with no selections", () => {
    const summary = computeMultiModeSummary([]);
    expect(summary.combinedOdds).toBe(1);
    expect(summary.estimatedPayout).toBe(0);
  });
});

describe("WagerBetSlip", () => {
  it("shows the current selection count in the floating badge", () => {
    renderBetSlip({ selections: [makeSelection({ id: "a" }), makeSelection({ id: "b" })] });
    expect(screen.getByTestId("bet-slip-badge").textContent).toContain("2");
  });

  it("does not render the drawer when isOpen is false", () => {
    renderBetSlip({ isOpen: false });
    expect(screen.queryByTestId("bet-slip-drawer")).toBeNull();
  });

  it("adding a stake change updates the total in real time", () => {
    const selection = makeSelection({ id: "a", stake: 10, odds: 2 });
    const { onUpdateStake } = renderBetSlip({ selections: [selection] });

    const input = screen.getByTestId("bet-slip-item-stake-a") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "25" } });

    expect(onUpdateStake).toHaveBeenCalledWith("a", 25);
  });

  it("removing a selection calls onRemove with the right id", () => {
    const { onRemove } = renderBetSlip({ selections: [makeSelection({ id: "a" })] });
    fireEvent.click(screen.getByTestId("bet-slip-item-remove-a"));
    expect(onRemove).toHaveBeenCalledWith("a");
  });

  it("shows the empty state when there are no selections", () => {
    renderBetSlip({ selections: [] });
    expect(screen.getByTestId("bet-slip-empty")).toBeTruthy();
  });

  it("calculates single-mode payout as the sum of independent legs", () => {
    renderBetSlip({
      selections: [
        makeSelection({ id: "a", stake: 10, odds: 2 }),
        makeSelection({ id: "b", stake: 5, odds: 4 }),
      ],
    });

    // Single mode is the default tab.
    expect(screen.getByTestId("bet-slip-estimated-payout").textContent).toBe(
      (10 * 2 + 5 * 4).toFixed(2),
    );
  });

  it("switching to multi mode calculates combined parlay odds", () => {
    renderBetSlip({
      selections: [
        makeSelection({ id: "a", stake: 10, odds: 2 }),
        makeSelection({ id: "b", stake: 5, odds: 3 }),
      ],
    });

    fireEvent.click(screen.getByTestId("bet-slip-tab-multi"));

    expect(screen.getByTestId("bet-slip-combined-odds").textContent).toBe("6.00x");
    expect(screen.getByTestId("bet-slip-estimated-payout").textContent).toBe((15 * 6).toFixed(2));
  });

  it("disables submission when total stake exceeds available balance", () => {
    renderBetSlip({
      selections: [makeSelection({ id: "a", stake: 500, odds: 2 })],
      availableBalance: 100,
    });

    const submitButton = screen.getByTestId("bet-slip-submit") as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);
    expect(screen.getByTestId("bet-slip-balance-warning")).toBeTruthy();
  });

  it("enables submission when the stake is within balance", () => {
    renderBetSlip({
      selections: [makeSelection({ id: "a", stake: 10, odds: 2 })],
      availableBalance: 1000,
    });

    const submitButton = screen.getByTestId("bet-slip-submit") as HTMLButtonElement;
    expect(submitButton.disabled).toBe(false);
  });

  it("disables submission when there are no selections", () => {
    renderBetSlip({ selections: [] });
    const submitButton = screen.getByTestId("bet-slip-submit") as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);
  });

  it("shows a loading state while bets are being submitted", async () => {
    let resolveSubmit: () => void = () => {};
    const onSubmitBets = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        }),
    );

    renderBetSlip({
      selections: [makeSelection({ id: "a", stake: 10, odds: 2 })],
      onSubmitBets,
    });

    const submitButton = screen.getByTestId("bet-slip-submit") as HTMLButtonElement;
    fireEvent.click(submitButton);

    expect(submitButton.textContent).toContain("Placing Bets");
    expect(submitButton.disabled).toBe(true);

    resolveSubmit();
    await vi.waitFor(() => {
      expect(screen.getByTestId("bet-slip-submit").textContent).toContain("Place All Bets");
    });
  });
});
