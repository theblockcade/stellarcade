import React, { useState, useEffect } from 'react';
import { VictoryConfettiOverlayProps } from './types';

export const formatPrizeAmount = (amount: number, symbol: string): string => {
  return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
};

export const VictoryConfettiOverlay: React.FC<VictoryConfettiOverlayProps> = ({
  isOpen,
  prizeAmount,
  currencySymbol,
  gameTitle,
  onPlayAgain,
  onClose,
  onClaim,
  onShare,
  autoDismissMs,
}) => {
  const [displayAmount, setDisplayAmount] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setDisplayAmount(0);
      return;
    }

    // Number odometer counter animation over 1.5 seconds
    const duration = 1500;
    const steps = 30;
    const stepDuration = duration / steps;
    const increment = prizeAmount / steps;
    let current = 0;
    let stepCount = 0;

    const interval = setInterval(() => {
      stepCount++;
      current += increment;
      if (stepCount >= steps) {
        setDisplayAmount(prizeAmount);
        clearInterval(interval);
      } else {
        setDisplayAmount(current);
      }
    }, stepDuration);

    // Auto-dismiss if configured
    let dismissTimer: NodeJS.Timeout | null = null;
    if (autoDismissMs && autoDismissMs > 0) {
      dismissTimer = setTimeout(() => {
        onClose();
      }, autoDismissMs);
    }

    // ESC key listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(interval);
      if (dismissTimer) clearTimeout(dismissTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, prizeAmount, autoDismissMs, onClose]);

  if (!isOpen) return null;

  return (
    <div className="victory-overlay-backdrop" data-testid="victory-confetti-overlay">
      <div className="confetti-container" data-testid="confetti-container">
        {/* Animated confetti particle elements */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className={`confetti-piece confetti-${i % 5}`} />
        ))}
      </div>

      <div className="victory-modal-card">
        <button
          className="close-overlay-btn"
          onClick={onClose}
          aria-label="Close celebration"
          data-testid="close-overlay-btn"
        >
          ✕
        </button>

        <div className="victory-header">
          <span className="trophy-icon">🏆</span>
          <h2 className="victory-title">VICTORY!</h2>
          <p className="game-subtitle">{gameTitle}</p>
        </div>

        <div className="prize-odometer" data-testid="prize-odometer">
          <span className="prize-label">YOU WON</span>
          <span className="prize-value" data-testid="prize-value">
            {formatPrizeAmount(displayAmount, currencySymbol)}
          </span>
        </div>

        <div className="victory-actions">
          {onPlayAgain && (
            <button className="btn-play-again" onClick={onPlayAgain} data-testid="play-again-btn">
              Play Again
            </button>
          )}
          {onClaim && (
            <button className="btn-claim" onClick={onClaim} data-testid="claim-wallet-btn">
              Claim to Wallet
            </button>
          )}
          <button
            className="btn-share"
            onClick={() => onShare?.('x')}
            data-testid="share-x-btn"
          >
            Share to X
          </button>
        </div>
      </div>
    </div>
  );
};
