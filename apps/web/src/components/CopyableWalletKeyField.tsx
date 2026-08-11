"use client";

import React, { useState, useCallback } from "react";
import { Tooltip } from "./Tooltip";
import { copyToClipboard } from "../utils/clipboard";
import "./CopyableWalletKeyField.css";

export interface CopyableWalletKeyFieldProps {
  label: string;
  value: string;
  masked?: boolean;
  maskChar?: string;
  showToggle?: boolean;
  onCopySuccess?: () => void;
  className?: string;
  testId?: string;
}

export const CopyableWalletKeyField: React.FC<CopyableWalletKeyFieldProps> = ({
  label,
  value,
  masked = false,
  maskChar = "*",
  showToggle = true,
  onCopySuccess,
  className = "",
  testId = "copyable-wallet-key",
}) => {
  const [isRevealed, setIsRevealed] = useState(!masked);
  const [isCopied, setIsCopied] = useState(false);

  const displayValue = isRevealed ? value : maskChar.repeat(Math.min(value.length, 16));

  const handleCopy = useCallback(async () => {
    const result = await copyToClipboard(value);
    if (result.success) {
      setIsCopied(true);
      onCopySuccess?.();
      setTimeout(() => setIsCopied(false), 2000);
    }
  }, [value, onCopySuccess]);

  return (
    <div
      className={`copyable-wallet-key-field ${className}`.trim()}
      data-testid={testId}
    >
      <label className="copyable-wallet-key-field__label">{label}</label>

      <div className="copyable-wallet-key-field__wrapper">
        <Tooltip content={isCopied ? "✓ Copied!" : "Click to copy"}>
          <div
            className="copyable-wallet-key-field__display"
            onClick={handleCopy}
            role="button"
            tabIndex={0}
            aria-label={`${label}: ${isRevealed ? value : "hidden"}`}
            data-testid={`${testId}-display`}
          >
            <code className="copyable-wallet-key-field__value">{displayValue}</code>
            <span aria-hidden="true">{isCopied ? "✓" : "📋"}</span>
          </div>
        </Tooltip>

        {showToggle && (
          <button
            type="button"
            className="copyable-wallet-key-field__toggle"
            onClick={() => setIsRevealed(!isRevealed)}
            aria-label={isRevealed ? "Hide key" : "Show key"}
            data-testid={`${testId}-toggle`}
          >
            {isRevealed ? "Hide" : "Show"}
          </button>
        )}
      </div>
    </div>
  );
};

CopyableWalletKeyField.displayName = "CopyableWalletKeyField";
export default CopyableWalletKeyField;
