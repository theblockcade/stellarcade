import React, { useMemo } from "react";
import type { SlotMachineReelsProps, SlotSymbol } from "./types";
import { ReelColumn } from "./ReelColumn";

const DEFAULT_MULTIPLIERS: Partial<Record<SlotSymbol, number>> = {
  seven: 100,
  diamond: 50,
  crown: 25,
  star: 10,
  bell: 5,
  coin: 3,
  bar: 2,
  cherry: 1,
};

const REEL_STOP_DELAY_MS = 400;

export const SlotMachineReels: React.FC<SlotMachineReelsProps> = ({
  reels,
  gameState,
  winningLine = null,
  betAmountXlm,
  jackpot,
  onSpin,
  onBetChange,
  payoutMultipliers = DEFAULT_MULTIPLIERS,
}) => {
  const isSpinning = gameState === "spinning" || gameState === "stopping";
  const isResolved = gameState === "resolved";

  const winMultiplier = useMemo(() => {
    if (!winningLine) return null;
    return payoutMultipliers[winningLine] ?? 1;
  }, [winningLine, payoutMultipliers]);

  const winAmount = useMemo(() => {
    if (!winMultiplier || betAmountXlm === undefined) return null;
    return betAmountXlm * winMultiplier;
  }, [winMultiplier, betAmountXlm]);

  return (
    <div className="slot-machine" data-testid="slot-machine">
      {jackpot !== undefined && (
        <div className="slot-machine__jackpot" data-testid="jackpot-display">
          <span>JACKPOT</span>
          <span data-testid="jackpot-amount">{jackpot} XLM</span>
        </div>
      )}

      <div className="slot-machine__reels" data-testid="reels-container" role="group" aria-label="Slot reels">
        {reels.map((symbols, i) => (
          <ReelColumn
            key={i}
            symbols={symbols}
            isSpinning={isSpinning}
            landedSymbol={isResolved ? symbols[0] : undefined}
            reelIndex={i}
            stopDelayMs={i * REEL_STOP_DELAY_MS}
          />
        ))}
      </div>

      {isResolved && winningLine && (
        <div
          className="slot-machine__win-banner"
          data-testid="win-banner"
          role="status"
          aria-live="polite"
        >
          <span data-testid="winning-symbol">{winningLine}</span>
          {winAmount !== null && (
            <span data-testid="win-amount">+{winAmount} XLM</span>
          )}
        </div>
      )}

      {betAmountXlm !== undefined && onBetChange && (
        <div className="slot-machine__bet-controls" data-testid="bet-controls">
          <button
            className="slot-machine__bet-btn"
            onClick={() => onBetChange(Math.max(1, betAmountXlm - 1))}
            disabled={isSpinning || betAmountXlm <= 1}
            data-testid="btn-bet-down"
            aria-label="Decrease bet"
          >
            −
          </button>
          <span className="slot-machine__bet-amount" data-testid="bet-amount">
            {betAmountXlm} XLM
          </span>
          <button
            className="slot-machine__bet-btn"
            onClick={() => onBetChange(betAmountXlm + 1)}
            disabled={isSpinning}
            data-testid="btn-bet-up"
            aria-label="Increase bet"
          >
            +
          </button>
        </div>
      )}

      <button
        className="slot-machine__spin-btn"
        onClick={onSpin}
        disabled={isSpinning}
        data-testid="btn-spin"
        aria-label="Spin"
      >
        {isSpinning ? "Spinning…" : "Spin"}
      </button>
    </div>
  );
};
