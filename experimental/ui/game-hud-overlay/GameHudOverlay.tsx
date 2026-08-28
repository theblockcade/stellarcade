import React, { useState } from 'react';
import { GameHudOverlayProps, REACTION_EMOJIS, ReactionEmoji } from './types';
import { TimerCountdownCircle } from './TimerCountdownCircle';

export const formatWager = (amount: number): string => {
  return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XLM`;
};

interface FloatingReaction {
  id: number;
  emoji: ReactionEmoji;
}

let reactionIdCounter = 0;

export const GameHudOverlay: React.FC<GameHudOverlayProps> = ({
  p1,
  p2,
  secondsRemaining,
  wagerAmount,
  onSendReaction,
  onSurrender,
}) => {
  const [confirmingSurrender, setConfirmingSurrender] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

  const handleReactionClick = (emoji: ReactionEmoji) => {
    const id = reactionIdCounter++;
    setFloatingReactions((prev) => [...prev, { id, emoji }]);
    // Fade the floating reaction out after its animation completes.
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 1200);
    onSendReaction(emoji);
  };

  const handleSurrenderClick = () => {
    setConfirmingSurrender(true);
  };

  const handleConfirmSurrender = () => {
    setConfirmingSurrender(false);
    onSurrender();
  };

  const handleCancelSurrender = () => {
    setConfirmingSurrender(false);
  };

  return (
    <div className="game-hud-overlay" data-testid="game-hud-overlay">
      <div className="game-hud-topbar" data-testid="game-hud-topbar">
        <div
          className={`player-score-pill player-score-pill--p1${p1.isCurrentTurn ? ' player-score-pill--active' : ''}`}
          data-testid="player-score-pill-p1"
        >
          <span className="player-name">{p1.name}</span>
          <span className="player-score" data-testid="player-score-p1">
            {p1.score}
          </span>
        </div>

        <div className="game-hud-center">
          <span className="wager-amount" data-testid="wager-amount">
            {formatWager(wagerAmount)}
          </span>
          <TimerCountdownCircle secondsRemaining={secondsRemaining} totalSeconds={60} />
        </div>

        <div
          className={`player-score-pill player-score-pill--p2${p2.isCurrentTurn ? ' player-score-pill--active' : ''}`}
          data-testid="player-score-pill-p2"
        >
          <span className="player-name">{p2.name}</span>
          <span className="player-score" data-testid="player-score-p2">
            {p2.score}
          </span>
        </div>
      </div>

      <div className="game-hud-reaction-tray" data-testid="reaction-tray">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            className="reaction-button"
            onClick={() => handleReactionClick(emoji)}
            aria-label={`Send ${emoji} reaction`}
            data-testid={`reaction-button-${emoji}`}
          >
            {emoji}
          </button>
        ))}

        <div className="floating-reactions" data-testid="floating-reactions">
          {floatingReactions.map((r) => (
            <span key={r.id} className="floating-reaction" data-testid="floating-reaction">
              {r.emoji}
            </span>
          ))}
        </div>
      </div>

      <button
        className="surrender-button"
        onClick={handleSurrenderClick}
        aria-label="Surrender match"
        data-testid="surrender-button"
      >
        Surrender
      </button>

      {confirmingSurrender && (
        <div className="surrender-confirm-dialog" data-testid="surrender-confirm-dialog">
          <p>Are you sure you want to surrender?</p>
          <button
            className="surrender-confirm-yes"
            onClick={handleConfirmSurrender}
            data-testid="surrender-confirm-yes"
          >
            Yes, surrender
          </button>
          <button
            className="surrender-confirm-no"
            onClick={handleCancelSurrender}
            data-testid="surrender-confirm-no"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
