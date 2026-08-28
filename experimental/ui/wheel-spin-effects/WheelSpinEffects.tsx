import React, { useState, useEffect, useRef } from 'react';
import { WheelSpinEffectsProps, SpinPhase } from './types';
import { ParticleCanvas } from './ParticleCanvas';
import './WheelSpinEffects.css';

const DECELERATION_MS = 2500;

/** Whether the environment currently prefers reduced motion. Safe to call outside the browser (returns false). */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const WheelSpinEffects: React.FC<WheelSpinEffectsProps> = ({
  isSpinning,
  targetAngle,
  onSpinComplete,
  particleIntensity = 'medium',
}) => {
  const [phase, setPhase] = useState<SpinPhase>('idle');
  const [showParticles, setShowParticles] = useState(false);
  const reducedMotion = prefersReducedMotion();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isSpinning && phase === 'idle') {
      setPhase('spinning');
      // The deceleration phase (cubic-bezier ease-out to targetAngle) runs
      // for a fixed duration matching the CSS transition below; instant
      // (0ms) under reduced motion, matching acceptance criteria.
      const duration = reducedMotion ? 0 : DECELERATION_MS;
      setPhase('decelerating');
      timeoutRef.current = setTimeout(() => {
        setPhase('complete');
        setShowParticles(true);
        onSpinComplete();
      }, duration);
    } else if (!isSpinning && phase !== 'idle') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setPhase('idle');
      setShowParticles(false);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only reacts to isSpinning transitions
  }, [isSpinning]);

  return (
    <div className="wse-container" data-phase={phase}>
      <div
        className={`wse-glow${phase === 'decelerating' || phase === 'complete' ? ' wse-glow-active' : ''}`}
        style={{
          transform: `rotate(${targetAngle}deg)`,
          transitionDuration: reducedMotion ? '0ms' : `${DECELERATION_MS}ms`,
        }}
        data-testid="wse-glow"
      />
      {showParticles && (
        <ParticleCanvas trigger={showParticles} intensity={particleIntensity} />
      )}
    </div>
  );
};

export default WheelSpinEffects;
