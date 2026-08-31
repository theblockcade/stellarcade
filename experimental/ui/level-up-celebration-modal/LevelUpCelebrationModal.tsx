import React, { useState, useEffect } from 'react';
import { LevelUpCelebrationModalProps } from './types';

export const clampProgressPercent = (xpIntoLevel: number, xpForNextLevel: number): number => {
  if (xpForNextLevel <= 0) return 0;
  const pct = (xpIntoLevel / xpForNextLevel) * 100;
  return Math.max(0, Math.min(100, pct));
};

export const LevelUpCelebrationModal: React.FC<LevelUpCelebrationModalProps> = ({
  isOpen,
  previousLevel,
  newLevel,
  xpIntoLevel,
  xpForNextLevel,
  unlockedPerks = [],
  onClose,
  onShare,
  autoDismissMs,
}) => {
  const [displayLevel, setDisplayLevel] = useState(previousLevel);

  useEffect(() => {
    if (!isOpen) {
      setDisplayLevel(previousLevel);
      return;
    }

    // Count up from previousLevel to newLevel over ~800ms, then let the
    // burst/perks animate in via CSS.
    const steps = Math.max(newLevel - previousLevel, 1);
    const stepDuration = 800 / steps;
    let current = previousLevel;

    const interval = setInterval(() => {
      current += 1;
      if (current >= newLevel) {
        setDisplayLevel(newLevel);
        clearInterval(interval);
      } else {
        setDisplayLevel(current);
      }
    }, stepDuration);

    let dismissTimer: ReturnType<typeof setTimeout> | null = null;
    if (autoDismissMs && autoDismissMs > 0) {
      dismissTimer = setTimeout(() => {
        onClose();
      }, autoDismissMs);
    }

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
  }, [isOpen, previousLevel, newLevel, autoDismissMs, onClose]);

  if (!isOpen) return null;

  const progressPercent = clampProgressPercent(xpIntoLevel, xpForNextLevel);

  return (
    <div className="level-up-backdrop" data-testid="level-up-celebration-modal">
      <div className="level-up-burst" data-testid="level-up-burst">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className={`level-up-ray level-up-ray-${i % 4}`} />
        ))}
      </div>

      <div className="level-up-card">
        <button
          className="level-up-close-btn"
          onClick={onClose}
          aria-label="Close level up celebration"
          data-testid="level-up-close-btn"
        >
          ✕
        </button>

        <div className="level-up-header">
          <span className="level-up-star-icon">⭐</span>
          <h2 className="level-up-title">LEVEL UP!</h2>
        </div>

        <div className="level-up-badge-row" data-testid="level-up-badge-row">
          <span className="level-up-badge level-up-badge-old" data-testid="level-up-old-badge">
            {previousLevel}
          </span>
          <span className="level-up-arrow" aria-hidden="true">
            →
          </span>
          <span className="level-up-badge level-up-badge-new" data-testid="level-up-new-badge">
            {displayLevel}
          </span>
        </div>

        <div className="level-up-progress-track" data-testid="level-up-progress-track">
          <div
            className="level-up-progress-fill"
            style={{ width: `${progressPercent}%` }}
            data-testid="level-up-progress-fill"
          />
        </div>
        <p className="level-up-xp-label">
          {xpIntoLevel} / {xpForNextLevel} XP to level {newLevel + 1}
        </p>

        {unlockedPerks.length > 0 && (
          <ul className="level-up-perks-list" data-testid="level-up-perks-list">
            {unlockedPerks.map((perk) => (
              <li key={perk.label} className="level-up-perk-item">
                {perk.icon && <span className="level-up-perk-icon">{perk.icon}</span>}
                {perk.label}
              </li>
            ))}
          </ul>
        )}

        <div className="level-up-actions">
          <button className="btn-level-up-continue" onClick={onClose} data-testid="continue-btn">
            Continue
          </button>
          {onShare && (
            <button
              className="btn-level-up-share"
              onClick={() => onShare('x')}
              data-testid="share-x-btn"
            >
              Share to X
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
