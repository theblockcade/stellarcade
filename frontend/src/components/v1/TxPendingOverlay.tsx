import React, { useEffect, useRef, useState } from 'react';
import './TxPendingOverlay.css';

export interface TxPendingOverlayProps {
  visible: boolean;
  message?: string;
  txHash?: string;
  onCancel?: () => void;
  testId?: string;
}

function truncateHash(hash: string): string {
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}…${hash.slice(-8)}`;
}

export const TxPendingOverlay: React.FC<TxPendingOverlayProps> = ({
  visible,
  message = 'Transaction in progress…',
  txHash,
  onCancel,
  testId = 'tx-pending-overlay',
}) => {
  const [cancelDisabled, setCancelDisabled] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible && onCancel) {
      setCancelDisabled(false);
      timerRef.current = setTimeout(() => {
        setCancelDisabled(true);
      }, 3000);
    }

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [visible, onCancel]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="tx-pending-overlay"
      role="status"
      aria-live="polite"
      data-testid={testId}
    >
      <div
        className="tx-pending-overlay__panel"
        data-testid={`${testId}-panel`}
      >
        <div
          className="tx-pending-overlay__spinner"
          aria-hidden="true"
          data-testid={`${testId}-spinner`}
        />

        <p className="tx-pending-overlay__message" data-testid={`${testId}-message`}>
          {message}
        </p>

        {txHash && (
          <p
            className="tx-pending-overlay__hash"
            title={txHash}
            data-testid={`${testId}-hash`}
          >
            Tx: <span className="tx-pending-overlay__hash-value">{truncateHash(txHash)}</span>
          </p>
        )}

        {onCancel && (
          <button
            type="button"
            className="tx-pending-overlay__cancel"
            onClick={onCancel}
            disabled={cancelDisabled}
            aria-disabled={cancelDisabled}
            data-testid={`${testId}-cancel`}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

TxPendingOverlay.displayName = 'TxPendingOverlay';

export default TxPendingOverlay;
