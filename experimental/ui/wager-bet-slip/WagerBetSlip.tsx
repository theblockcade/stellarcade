import React, { useMemo, useState } from "react";
import { BetSlipItem } from "./BetSlipItem";
import { BetMode, BetSelection, BetSlipSummary, WagerBetSlipProps } from "./types";

/** Sum of each selection's own stake * odds, independent of the others. */
export function computeSingleModeSummary(selections: BetSelection[]): BetSlipSummary {
  const totalStake = selections.reduce((sum, s) => sum + s.stake, 0);
  const estimatedPayout = selections.reduce((sum, s) => sum + s.stake * s.odds, 0);

  return {
    totalStake,
    combinedOdds: 1,
    estimatedPayout,
    potentialProfit: estimatedPayout - totalStake,
  };
}

/** Parlay-style combined odds: every selection's odds multiply together,
 * and the combined multiplier applies to the total staked across all legs. */
export function computeMultiModeSummary(selections: BetSelection[]): BetSlipSummary {
  const totalStake = selections.reduce((sum, s) => sum + s.stake, 0);
  const combinedOdds = selections.reduce((product, s) => product * s.odds, 1);
  const estimatedPayout = totalStake * combinedOdds;

  return {
    totalStake,
    combinedOdds,
    estimatedPayout,
    potentialProfit: estimatedPayout - totalStake,
  };
}

export function computeBetSlipSummary(selections: BetSelection[], mode: BetMode): BetSlipSummary {
  return mode === "multi" ? computeMultiModeSummary(selections) : computeSingleModeSummary(selections);
}

export const WagerBetSlip: React.FC<WagerBetSlipProps> = ({
  isOpen,
  selections,
  availableBalance,
  onUpdateStake,
  onRemove,
  onSubmitBets,
  onClose,
}) => {
  const [mode, setMode] = useState<BetMode>("single");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const summary = useMemo(() => computeBetSlipSummary(selections, mode), [selections, mode]);

  const exceedsBalance = summary.totalStake > availableBalance;
  const canSubmit = selections.length > 0 && summary.totalStake > 0 && !exceedsBalance && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await onSubmitBets();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="bet-slip-badge" data-testid="bet-slip-badge">
        {selections.length} {selections.length === 1 ? "Bet" : "Bets"}
      </div>

      {isOpen && (
        <div className="bet-slip-drawer" data-testid="bet-slip-drawer" role="dialog" aria-label="Bet slip">
          <div className="bet-slip-drawer-header">
            <h2>Bet Slip</h2>
            {onClose && (
              <button type="button" onClick={onClose} aria-label="Close bet slip" data-testid="bet-slip-close">
                ✕
              </button>
            )}
          </div>

          <div className="bet-slip-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "single"}
              className={mode === "single" ? "bet-slip-tab bet-slip-tab--active" : "bet-slip-tab"}
              onClick={() => setMode("single")}
              data-testid="bet-slip-tab-single"
            >
              Single
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "multi"}
              className={mode === "multi" ? "bet-slip-tab bet-slip-tab--active" : "bet-slip-tab"}
              onClick={() => setMode("multi")}
              data-testid="bet-slip-tab-multi"
            >
              Multi
            </button>
          </div>

          <div className="bet-slip-items" data-testid="bet-slip-items">
            {selections.length === 0 ? (
              <div className="bet-slip-empty" data-testid="bet-slip-empty">
                No selections yet. Add a bet to get started.
              </div>
            ) : (
              selections.map((selection) => (
                <BetSlipItem
                  key={selection.id}
                  selection={selection}
                  onUpdateStake={onUpdateStake}
                  onRemove={onRemove}
                />
              ))
            )}
          </div>

          <div className="bet-slip-summary" data-testid="bet-slip-summary">
            <div className="bet-slip-summary-row">
              <span>Total Stake</span>
              <span data-testid="bet-slip-total-stake">{summary.totalStake.toFixed(2)}</span>
            </div>
            {mode === "multi" && (
              <div className="bet-slip-summary-row">
                <span>Combined Odds</span>
                <span data-testid="bet-slip-combined-odds">{summary.combinedOdds.toFixed(2)}x</span>
              </div>
            )}
            <div className="bet-slip-summary-row">
              <span>Estimated Payout</span>
              <span data-testid="bet-slip-estimated-payout">{summary.estimatedPayout.toFixed(2)}</span>
            </div>
            <div className="bet-slip-summary-row">
              <span>Potential Profit</span>
              <span data-testid="bet-slip-potential-profit">{summary.potentialProfit.toFixed(2)}</span>
            </div>
          </div>

          {exceedsBalance && (
            <div className="bet-slip-warning" role="alert" data-testid="bet-slip-balance-warning">
              Total stake exceeds your available balance.
            </div>
          )}

          <button
            type="button"
            className="bet-slip-submit"
            onClick={handleSubmit}
            disabled={!canSubmit}
            data-testid="bet-slip-submit"
          >
            {isSubmitting ? "Placing Bets…" : "Place All Bets"}
          </button>
        </div>
      )}
    </>
  );
};
