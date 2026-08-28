import React from "react";
import { WagerKeypadControlProps } from "./types";

const KEYPAD_DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

/** Clamp a numeric value to [minBet, maxBalance], returned as a plain
 * decimal string (no thousands separators, since it feeds back into the
 * editable value string). */
export function clampWagerValue(value: number, minBet: number, maxBalance: number): string {
  const clamped = Math.min(Math.max(value, minBet), maxBalance);
  return trimTrailingZeros(clamped);
}

function trimTrailingZeros(value: number): string {
  return value.toFixed(7).replace(/\.?0+$/, "") || "0";
}

/** Append a digit/decimal-point keystroke to `current`, enforcing a single
 * decimal point. Returns `current` unchanged for a second decimal point. */
export function appendDigit(current: string, digit: string): string {
  if (digit === "." && current.includes(".")) return current;
  if (current === "0" && digit !== ".") return digit;
  return current + digit;
}

export function backspace(current: string): string {
  const next = current.slice(0, -1);
  return next === "" ? "0" : next;
}

export const WagerKeypadControl: React.FC<WagerKeypadControlProps> = ({
  value,
  maxBalance,
  minBet,
  onChange,
  onSubmit,
}) => {
  const numericValue = parseFloat(value) || 0;
  const exceedsBalance = numericValue > maxBalance;
  const isSubmittable = numericValue > 0 && numericValue <= maxBalance;

  const handleKeyPress = (key: string) => {
    if (key === "⌫") {
      onChange(backspace(value));
    } else {
      onChange(appendDigit(value, key));
    }
  };

  const handleHalve = () => {
    onChange(clampWagerValue(numericValue / 2, minBet, maxBalance));
  };

  const handleDouble = () => {
    onChange(clampWagerValue(numericValue * 2, minBet, maxBalance));
  };

  const handleMax = () => {
    onChange(clampWagerValue(maxBalance, minBet, maxBalance));
  };

  const handleMin = () => {
    onChange(clampWagerValue(minBet, minBet, maxBalance));
  };

  return (
    <div className="wager-keypad-control" data-testid="wager-keypad-control">
      <div
        className={`wager-value-display${exceedsBalance ? " wager-value-display--invalid" : ""}`}
        data-testid="wager-value-display"
        data-invalid={exceedsBalance}
      >
        {value}
      </div>

      <div className="wager-quick-actions">
        <button type="button" onClick={handleHalve} data-testid="wager-quick-half">
          ½X
        </button>
        <button type="button" onClick={handleDouble} data-testid="wager-quick-double">
          2X
        </button>
        <button type="button" onClick={handleMin} data-testid="wager-quick-min">
          MIN
        </button>
        <button type="button" onClick={handleMax} data-testid="wager-quick-max">
          MAX
        </button>
      </div>

      <div className="wager-numeric-keypad" data-testid="wager-numeric-keypad">
        {KEYPAD_DIGITS.map((key) => (
          <button
            key={key}
            type="button"
            className="wager-keypad-key"
            onClick={() => handleKeyPress(key)}
            aria-label={key === "⌫" ? "Backspace" : key === "." ? "Decimal point" : `Digit ${key}`}
            data-testid={`wager-key-${key === "⌫" ? "backspace" : key === "." ? "decimal" : key}`}
          >
            {key}
          </button>
        ))}
      </div>

      {onSubmit && (
        <button
          type="button"
          className="wager-submit-button"
          onClick={onSubmit}
          disabled={!isSubmittable}
          data-testid="wager-submit-button"
        >
          Place Wager
        </button>
      )}
    </div>
  );
};
