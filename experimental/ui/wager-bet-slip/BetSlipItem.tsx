import React from "react";
import { BetSlipItemProps } from "./types";

export const BetSlipItem: React.FC<BetSlipItemProps> = ({ selection, onUpdateStake, onRemove }) => {
  const handleStakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const parsed = parseFloat(raw);
    onUpdateStake(selection.id, Number.isFinite(parsed) && parsed >= 0 ? parsed : 0);
  };

  const potentialReturn = selection.stake * selection.odds;

  return (
    <div className="bet-slip-item" data-testid={`bet-slip-item-${selection.id}`}>
      <div className="bet-slip-item-header">
        <span className="bet-slip-item-game" data-testid={`bet-slip-item-game-${selection.id}`}>
          {selection.gameTitle}
        </span>
        <button
          type="button"
          aria-label={`Remove ${selection.gameTitle} from bet slip`}
          onClick={() => onRemove(selection.id)}
          data-testid={`bet-slip-item-remove-${selection.id}`}
        >
          ✕
        </button>
      </div>

      <div className="bet-slip-item-selection" data-testid={`bet-slip-item-selection-${selection.id}`}>
        {selection.selectionLabel}
      </div>

      <div className="bet-slip-item-footer">
        <span className="bet-slip-item-odds" data-testid={`bet-slip-item-odds-${selection.id}`}>
          {selection.odds.toFixed(2)}x
        </span>

        <label className="bet-slip-item-stake-label">
          Stake
          <input
            type="number"
            min={0}
            step="0.01"
            value={selection.stake}
            onChange={handleStakeChange}
            aria-label={`Stake for ${selection.gameTitle}`}
            data-testid={`bet-slip-item-stake-${selection.id}`}
          />
        </label>

        <span className="bet-slip-item-return" data-testid={`bet-slip-item-return-${selection.id}`}>
          Returns {potentialReturn.toFixed(2)}
        </span>
      </div>
    </div>
  );
};
