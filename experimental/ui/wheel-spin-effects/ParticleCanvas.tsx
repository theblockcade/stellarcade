import React, { useRef, useEffect, useCallback } from 'react';
import { Particle, ParticleIntensity, PARTICLE_COUNT_BY_INTENSITY } from './types';

const COLORS = ['#ffd700', '#fff5b8', '#00e5ff', '#ff6ad5'];

/** Spawns a burst of particles radiating outward from the canvas center. */
export const spawnParticles = (
  count: number,
  width: number,
  height: number
): Particle[] => {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
    const speed = 2 + Math.random() * 4;
    particles.push({
      x: width / 2,
      y: height / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: 40 + Math.random() * 30,
      color: COLORS[i % COLORS.length],
      size: 2 + Math.random() * 3,
    });
  }
  return particles;
};

/**
 * Advances every particle by one tick and drops particles past their
 * lifetime — the mechanism responsible for particles cleaning themselves up
 * rather than accumulating indefinitely across animation frames.
 */
export const stepParticles = (particles: Particle[]): Particle[] => {
  return particles
    .map((p) => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.08, // gentle gravity
      life: p.life + 1,
    }))
    .filter((p) => p.life < p.maxLife);
};

export interface ParticleCanvasProps {
  trigger: boolean;
  intensity?: ParticleIntensity;
  width?: number;
  height?: number;
}

export const ParticleCanvas: React.FC<ParticleCanvasProps> = ({
  trigger,
  intensity = 'medium',
  width = 320,
  height = 320,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number | null>(null);
  const prevTriggerRef = useRef(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, width, height);
    particlesRef.current = stepParticles(particlesRef.current);

    for (const p of particlesRef.current) {
      const alpha = Math.max(0, 1 - p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (particlesRef.current.length > 0) {
      frameRef.current = requestAnimationFrame(draw);
    } else {
      frameRef.current = null;
    }
  }, [width, height]);

  useEffect(() => {
    if (trigger && !prevTriggerRef.current) {
      const count = PARTICLE_COUNT_BY_INTENSITY[intensity];
      particlesRef.current = [...particlesRef.current, ...spawnParticles(count, width, height)];
      if (frameRef.current === null) {
        frameRef.current = requestAnimationFrame(draw);
      }
    }
    prevTriggerRef.current = trigger;
  }, [trigger, intensity, width, height, draw]);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="wse-particle-canvas"
      aria-hidden="true"
    />
  );
};

export default ParticleCanvas;
