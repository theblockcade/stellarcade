import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FloatingCheerEmitter } from './FloatingCheerEmitter';
import type { SpectatorCheerViewProps, CheerType, CheerReaction, TurnAction } from './types';
import './SpectatorCheerView.css';

/** Format elapsed seconds into MM:SS. */
export const formatTimer = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

/** Format pot amount with dollar sign and commas. */
export const formatPot = (amount: number): string => {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/** Format viewer count for display. */
export const formatViewerCount = (count: number): string => {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
};

const CHEER_CONFIG: Record<CheerType, { emoji: string; label: string }> = {
  clap: { emoji: '\uD83D\uDC4F', label: 'Cheer' },
  fire: { emoji: '\uD83D\uDD25', label: 'Fire' },
  diamond: { emoji: '\uD83D\uDC8E', label: 'Diamond' },
};

export const SpectatorCheerView: React.FC<SpectatorCheerViewProps> = ({
  match,
  viewerCount,
  onSendCheer,
  onLeaveSpectator,
  className = '',
  testId = 'spectator-cheer-view',
}) => {
  const [reactions, setReactions] = useState<CheerReaction[]>([]);
  const idCounter = useRef(0);

  const handleCheer = useCallback(
    (type: CheerType) => {
      onSendCheer(type);
      const reaction: CheerReaction = {
        id: `cheer-${++idCounter.current}`,
        type,
        x: Math.random() * 80 + 10,
        y: 100,
        createdAt: Date.now(),
      };
      setReactions((prev) => [...prev, reaction]);
    },
    [onSendCheer],
  );

  const handleReactionComplete = useCallback((id: string) => {
    setReactions((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Clean up expired reactions after 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setReactions((prev) => prev.filter((r) => now - r.createdAt < 3000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`scv-container ${className}`} data-testid={testId}>
      {/* Top bar: viewer count, pot, timer */}
      <div className="scv-header" data-testid="scv-header">
        <div className="scv-viewer-badge" data-testid="scv-viewer-count">
          <span className="scv-viewer-icon" aria-hidden="true">{'\uD83D\uDC41'}</span>
          <span>{formatViewerCount(viewerCount)} Watching</span>
        </div>
        <div className="scv-pot" data-testid="scv-pot">
          Active Pot: {formatPot(match.potAmount)}
        </div>
        <div className="scv-timer" data-testid="scv-timer">
          {formatTimer(match.elapsedSeconds)}
        </div>
        <button
          className="scv-leave-btn"
          onClick={onLeaveSpectator}
          data-testid="scv-leave-btn"
          aria-label="Leave spectator mode"
        >
          Leave
        </button>
      </div>

      {/* Match info */}
      <div className="scv-match-info" data-testid="scv-match-info">
        <span className="scv-player">{match.player1}</span>
        <span className="scv-vs">vs</span>
        <span className="scv-player">{match.player2}</span>
      </div>

      {/* Turn timeline */}
      <div className="scv-timeline" data-testid="scv-timeline">
        {match.turnActions.slice(-5).map((action, i) => (
          <div key={`${action.playerId}-${action.timestamp}-${i}`} className="scv-timeline-entry">
            <strong>{action.playerName}</strong>: {action.action}
          </div>
        ))}
        {match.turnActions.length === 0 && (
          <div className="scv-timeline-empty">Waiting for first move...</div>
        )}
      </div>

      {/* Cheer buttons */}
      <div className="scv-cheer-bar" data-testid="scv-cheer-bar">
        {(Object.keys(CHEER_CONFIG) as CheerType[]).map((type) => (
          <button
            key={type}
            className="scv-cheer-btn"
            onClick={() => handleCheer(type)}
            data-testid={`scv-cheer-${type}`}
            aria-label={`Send ${CHEER_CONFIG[type].label} cheer`}
          >
            <span className="scv-cheer-emoji" aria-hidden="true">{CHEER_CONFIG[type].emoji}</span>
            <span>{CHEER_CONFIG[type].label}</span>
          </button>
        ))}
      </div>

      {/* Floating cheer particles */}
      <FloatingCheerEmitter reactions={reactions} onComplete={handleReactionComplete} />
    </div>
  );
};

SpectatorCheerView.displayName = 'SpectatorCheerView';
export default SpectatorCheerView;
