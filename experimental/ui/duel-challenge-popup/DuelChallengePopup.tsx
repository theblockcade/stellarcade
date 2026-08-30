import React, { useEffect, useRef, useState } from "react";
import type { DuelChallengePopupProps } from "./types";

export const DuelChallengePopup: React.FC<DuelChallengePopupProps> = ({
  challenger,
  gameTitle,
  stakeAmountXlm,
  expiresInSeconds = 30,
  status = "pending",
  onAccept,
  onDecline,
  onClose,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(expiresInSeconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status !== "pending") return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  const isPending = status === "pending" && secondsLeft > 0;

  return (
    <div
      className="duel-popup-backdrop"
      data-testid="duel-popup-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Duel challenge from ${challenger.username}`}
    >
      <div className="duel-popup" data-testid="duel-popup">
        {onClose && (
          <button
            className="duel-popup__close"
            onClick={onClose}
            data-testid="btn-close"
            aria-label="Close"
          >
            ×
          </button>
        )}

        <div className="duel-popup__header">
          {challenger.avatarUrl ? (
            <img
              className="duel-popup__avatar"
              src={challenger.avatarUrl}
              alt={`${challenger.username} avatar`}
              data-testid="challenger-avatar"
            />
          ) : (
            <div
              className="duel-popup__avatar duel-popup__avatar--placeholder"
              data-testid="challenger-avatar-placeholder"
              aria-label={`${challenger.username} avatar`}
            >
              {challenger.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="duel-popup__challenger-info">
            <span className="duel-popup__username" data-testid="challenger-username">
              {challenger.username}
            </span>
            {challenger.level !== undefined && (
              <span className="duel-popup__level" data-testid="challenger-level">
                Level {challenger.level}
              </span>
            )}
            {challenger.winRate !== undefined && (
              <span className="duel-popup__winrate" data-testid="challenger-winrate">
                {Math.round(challenger.winRate * 100)}% win rate
              </span>
            )}
          </div>
        </div>

        <div className="duel-popup__body">
          <p className="duel-popup__challenge-text" data-testid="challenge-text">
            challenges you to a duel in
          </p>
          <p className="duel-popup__game-title" data-testid="game-title">
            {gameTitle}
          </p>
          {stakeAmountXlm !== undefined && (
            <p className="duel-popup__stake" data-testid="stake-amount">
              Stake: {stakeAmountXlm} XLM
            </p>
          )}
        </div>

        {status === "pending" && (
          <div
            className="duel-popup__timer"
            data-testid="expiry-timer"
            aria-live="polite"
            aria-label={`Expires in ${secondsLeft} seconds`}
          >
            <span className="duel-popup__timer-value">{secondsLeft}s</span>
          </div>
        )}

        {status !== "pending" && (
          <div
            className={`duel-popup__status duel-popup__status--${status}`}
            data-testid="duel-status"
          >
            {status === "accepted" && "Challenge Accepted!"}
            {status === "declined" && "Challenge Declined"}
            {status === "expired" && "Challenge Expired"}
          </div>
        )}

        <div className="duel-popup__actions">
          <button
            className="duel-popup__btn duel-popup__btn--accept"
            onClick={onAccept}
            disabled={!isPending}
            data-testid="btn-accept"
            aria-label="Accept duel"
          >
            Accept
          </button>
          <button
            className="duel-popup__btn duel-popup__btn--decline"
            onClick={onDecline}
            disabled={!isPending}
            data-testid="btn-decline"
            aria-label="Decline duel"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};
