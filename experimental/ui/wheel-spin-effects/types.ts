export type ParticleIntensity = 'low' | 'medium' | 'high';

export type SpinPhase = 'idle' | 'spinning' | 'decelerating' | 'complete';

export interface WheelSpinEffectsProps {
  isSpinning: boolean;
  targetAngle: number;
  onSpinComplete: () => void;
  particleIntensity?: ParticleIntensity;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export const PARTICLE_COUNT_BY_INTENSITY: Record<ParticleIntensity, number> = {
  low: 20,
  medium: 50,
  high: 100,
};
