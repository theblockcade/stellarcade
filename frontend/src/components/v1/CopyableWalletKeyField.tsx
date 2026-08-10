import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Tooltip } from './Tooltip';
import { copyToClipboard } from '../../utils/v1/clipboard';
import './CopyableWalletKeyField.css';

/**
 * CopyableWalletKeyField - Display wallet keys with copy-to-clipboard feedback.
 *
 * Features:
 * - Secure wallet key display with optional masking
 * - Copy-to-clipboard with tooltip feedback
 * - Hover states for better UX
 * - Keyboard accessible (Enter/Space to copy)
 * - Screen reader friendly
 * - Feedback tooltip with auto-dismiss
 * - Error handling for clipboard issues
 *
 * Usage:
 * <CopyableWalletKeyField
 *   label="Private Key"
 *   value={privateKey}
 *   masked={!showKey}
 *   onCopySuccess={() => console.log('Copied!')}
 * />
 */

export interface CopyableWalletKeyFieldProps {
  /** Label for the field (e.g., "Private Key", "Address") */
  label: string;
  /** The actual key/address to copy */
  value: string;
  /** Whether to mask the value initially */
  masked?: boolean;
  /** Character to use for masking (default: '*') */
  maskChar?: string;
  /** Show a toggle button to reveal/hide the key */
  showToggle?: boolean;
  /** Duration in ms to show the "Copied!" feedback (default: 2000) */
  feedbackDurationMs?: number;
  /** Optional callback when copy is successful */
  onCopySuccess?: () => void;
  /** Optional callback when copy fails */
  onCopyError?: (error: Error) => void;
  /** Additional CSS class names */
  className?: string;
  /** Test ID for component testing */
  testId?: string;
  /** Read-only mode (still copyable) */
  readOnly?: boolean;
}

export const CopyableWalletKeyField: React.FC<CopyableWalletKeyFieldProps> = ({
  label,
  value,
  masked = false,
  maskChar = '*',
  showToggle = true,
  feedbackDurationMs = 2000,
  onCopySuccess,
  onCopyError,
  className = '',
  testId = 'copyable-wallet-key',
  readOnly = true,
}) => {
  const [isRevealed, setIsRevealed] = useState(!masked);
  const [isCopied, setIsCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout>();

  // Generate masked value
  const displayValue = isRevealed ? value : maskChar.repeat(Math.min(value.length, 16));

  // Handle copy action
  const handleCopy = useCallback(async () => {
    try {
      setCopyError(null);
      const result = await copyToClipboard(value);

      if (result.success) {
        setIsCopied(true);
        onCopySuccess?.();

        // Clear previous timeout
        if (feedbackTimeoutRef.current) {
          clearTimeout(feedbackTimeoutRef.current);
        }

        // Auto-dismiss feedback after duration
        feedbackTimeoutRef.current = setTimeout(() => {
          setIsCopied(false);
        }, feedbackDurationMs);
      } else {
        const error = new Error('Clipboard access not available');
        setCopyError('Unable to copy to clipboard');
        onCopyError?.(error);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setCopyError('Copy failed');
      onCopyError?.(err);
    }
  }, [value, feedbackDurationMs, onCopySuccess, onCopyError]);

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCopy();
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`copyable-wallet-key-field ${className}`.trim()}
      data-testid={testId}
    >
      {/* Label */}
      <label className="copyable-wallet-key-field__label" htmlFor={`${testId}-display`}>
        {label}
      </label>

      {/* Key display with copy button */}
      <div className="copyable-wallet-key-field__wrapper">
        {/* Display field */}
        <Tooltip
          content={isCopied ? '✓ Copied!' : 'Click to copy'}
          position="top"
          testId={`${testId}-tooltip`}
        >
          <div
            className="copyable-wallet-key-field__display"
            onClick={handleCopy}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-label={`${label}: ${isRevealed ? value : 'hidden'}`}
            aria-pressed={isCopied}
            data-testid={`${testId}-display`}
            data-copied={isCopied}
          >
            <code className="copyable-wallet-key-field__value" aria-hidden="false">
              {displayValue}
            </code>

            {/* Copy icon */}
            <span
              className={`copyable-wallet-key-field__icon copyable-wallet-key-field__icon--${
                isCopied ? 'check' : 'copy'
              }`}
              aria-hidden="true"
              data-testid={`${testId}-icon`}
            />
          </div>
        </Tooltip>

        {/* Actions row */}
        <div className="copyable-wallet-key-field__actions">
          {/* Toggle reveal button */}
          {showToggle && (
            <button
              type="button"
              className="copyable-wallet-key-field__toggle"
              onClick={() => setIsRevealed(!isRevealed)}
              aria-label={isRevealed ? 'Hide key' : 'Show key'}
              data-testid={`${testId}-toggle`}
              title={isRevealed ? 'Hide' : 'Show'}
            >
              <span
                className={`icon icon--${isRevealed ? 'eye-off' : 'eye'}`}
                aria-hidden="true"
              />
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {copyError && (
        <div
          className="copyable-wallet-key-field__error"
          role="alert"
          data-testid={`${testId}-error`}
        >
          {copyError}
        </div>
      )}

      {/* Helper text */}
      <p className="copyable-wallet-key-field__hint">
        Click the field or key to copy to clipboard
      </p>
    </div>
  );
};

CopyableWalletKeyField.displayName = 'CopyableWalletKeyField';
export default CopyableWalletKeyField;
