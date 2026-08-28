import React, { useEffect, useRef } from 'react';
import type { CheerReaction, CheerType } from './types';

const CHEER_EMOJI: Record<CheerType, string> = {
  clap: '\uD83D\uDC4F',
  fire: '\uD83D\uDD25',
  diamond: '\uD83D\uDC8E',
};

export interface FloatingCheerEmitterProps {
  reactions: CheerReaction[];
  onComplete: (id: string) => void;
  className?: string;
  testId?: string;
}

/**
 * Renders floating particle elements for each cheer reaction.
 * Particles animate upward and self-remove after completion.
 */
export const FloatingCheerEmitter: React.FC<FloatingCheerEmitterProps> = ({
  reactions,
  onComplete,
  className = '',
  testId = 'floating-cheer-emitter',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reactions.length === 0) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const reaction of reactions) {
      const timer = setTimeout(() => {
        onComplete(reaction.id);
      }, 3000);
      timers.push(timer);
    }
    return () => timers.forEach(clearTimeout);
  }, [reactions, onComplete]);

  return (
    <div
      ref={containerRef}
      className={`fce-container ${className}`}
      data-testid={testId}
      aria-hidden="true"
    >
      {reactions.map((reaction) => (
        <div
          key={reaction.id}
          className="fce-particle"
          data-testid="fce-particle"
          style={{
            left: `${reaction.x}%`,
            bottom: '0%',
          }}
        >
          <span className="fce-emoji">{CHEER_EMOJI[reaction.type]}</span>
        </div>
      ))}
    </div>
  );
};

FloatingCheerEmitter.displayName = 'FloatingCheerEmitter';
export default FloatingCheerEmitter;
