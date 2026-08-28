import React, { useState, useEffect, useCallback } from 'react';
import { QuickDepositDrawerProps, PRESET_DEPOSIT_AMOUNTS } from './types';
import './QuickDepositDrawer.css';

/** Truncates a Stellar public key for display, e.g. "GABC...WXYZ". */
export const truncateAddress = (address: string): string => {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const QuickDepositDrawer: React.FC<QuickDepositDrawerProps> = ({
  isOpen,
  onClose,
  walletAddress,
  currentBalance,
  onDeposit,
  isTestnet = false,
  onFriendbotFund,
}) => {
  const [copied, setCopied] = useState(false);
  const [depositingAmount, setDepositingAmount] = useState<number | null>(null);
  const [fundingFriendbot, setFundingFriendbot] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
    } catch {
      // Clipboard API unavailable — no-op, the address is still visible to copy manually.
    }
  }, [walletAddress]);

  const handlePresetClick = useCallback(
    async (amount: number) => {
      setError(null);
      setDepositingAmount(amount);
      try {
        await onDeposit(amount);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Deposit failed');
      } finally {
        setDepositingAmount(null);
      }
    },
    [onDeposit]
  );

  const handleFriendbotFund = useCallback(async () => {
    if (!onFriendbotFund) return;
    setError(null);
    setFundingFriendbot(true);
    try {
      await onFriendbotFund();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Friendbot funding failed');
    } finally {
      setFundingFriendbot(false);
    }
  }, [onFriendbotFund]);

  if (!isOpen) return null;

  return (
    <div
      className="qdd-backdrop"
      onClick={onClose}
      data-testid="qdd-backdrop"
    >
      <div
        className="qdd-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Quick deposit"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="qdd-header">
          <h2>Quick Deposit</h2>
          <button type="button" aria-label="Close" className="qdd-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="qdd-balance">
          <span className="qdd-balance-label">Current balance</span>
          <strong>{currentBalance.toFixed(2)} XLM</strong>
        </div>

        <div className="qdd-qr-section">
          <img
            className="qdd-qr-code"
            alt={`QR code for wallet address ${walletAddress}`}
            src={`data:image/svg+xml;utf8,${encodeURIComponent(renderPlaceholderQr(walletAddress))}`}
          />
          <div className="qdd-address-row">
            <code className="qdd-address">{truncateAddress(walletAddress)}</code>
            <button type="button" className="qdd-copy-btn" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          {copied && (
            <span className="qdd-copy-badge" role="status">
              Address copied to clipboard
            </span>
          )}
        </div>

        <div className="qdd-presets">
          <span className="qdd-presets-label">Quick fund</span>
          <div className="qdd-preset-buttons">
            {PRESET_DEPOSIT_AMOUNTS.map((amount) => (
              <button
                key={amount}
                type="button"
                className="qdd-preset-btn"
                disabled={depositingAmount !== null}
                onClick={() => handlePresetClick(amount)}
              >
                {depositingAmount === amount ? (
                  <span className="qdd-spinner" aria-label="Depositing" />
                ) : (
                  `${amount} XLM`
                )}
              </button>
            ))}
          </div>
        </div>

        {isTestnet && onFriendbotFund && (
          <button
            type="button"
            className="qdd-friendbot-btn"
            disabled={fundingFriendbot}
            onClick={handleFriendbotFund}
          >
            {fundingFriendbot ? (
              <span className="qdd-spinner" aria-label="Requesting testnet funds" />
            ) : (
              'Fund with Testnet Friendbot'
            )}
          </button>
        )}

        {error && (
          <p className="qdd-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Placeholder QR rendering: a deterministic pattern derived from the address
 * so tests and the visual layout have something stable to render against,
 * without pulling in a QR-generation dependency for this experimental
 * component. A production version would swap this for a real QR library.
 */
function renderPlaceholderQr(data: string): string {
  const size = 160;
  const cells = 12;
  const cellSize = size / cells;
  let rects = '';
  for (let i = 0; i < cells * cells; i++) {
    const charCode = data.charCodeAt(i % data.length) || 0;
    if (charCode % 2 === 0) continue;
    const x = (i % cells) * cellSize;
    const y = Math.floor(i / cells) * cellSize;
    rects += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="#111"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="#fff"/>${rects}</svg>`;
}

export default QuickDepositDrawer;
