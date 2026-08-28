import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import React from 'react';
import { WheelSpinEffects } from './WheelSpinEffects';
import { spawnParticles, stepParticles } from './ParticleCanvas';

describe('spawnParticles / stepParticles', () => {
  it('spawns the requested number of particles at the canvas center', () => {
    const particles = spawnParticles(10, 100, 100);
    expect(particles).toHaveLength(10);
    for (const p of particles) {
      expect(p.x).toBe(50);
      expect(p.y).toBe(50);
    }
  });

  it('advances particle positions and increments life each step', () => {
    const particles = spawnParticles(1, 100, 100);
    const stepped = stepParticles(particles);
    expect(stepped[0].life).toBe(1);
    expect(stepped[0].x).not.toBe(particles[0].x);
  });

  it('removes particles once they exceed their lifetime (cleanup, no leak)', () => {
    let particles = spawnParticles(1, 100, 100);
    particles[0].maxLife = 2;
    particles = stepParticles(particles);
    particles = stepParticles(particles);
    expect(particles).toHaveLength(0);
  });
});

describe('WheelSpinEffects', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('transitions from idle to decelerating when isSpinning becomes true', () => {
    const { container, rerender } = render(
      <WheelSpinEffects isSpinning={false} targetAngle={180} onSpinComplete={vi.fn()} />
    );
    expect(container.firstChild).toHaveAttribute('data-phase', 'idle');

    rerender(<WheelSpinEffects isSpinning={true} targetAngle={180} onSpinComplete={vi.fn()} />);
    expect(container.firstChild).toHaveAttribute('data-phase', 'decelerating');
  });

  it('transitions to complete and calls onSpinComplete after the deceleration duration', async () => {
    const onSpinComplete = vi.fn();
    const { container, rerender } = render(
      <WheelSpinEffects isSpinning={false} targetAngle={180} onSpinComplete={onSpinComplete} />
    );
    rerender(<WheelSpinEffects isSpinning={true} targetAngle={180} onSpinComplete={onSpinComplete} />);

    expect(onSpinComplete).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2500);
    });

    expect(onSpinComplete).toHaveBeenCalledTimes(1);
    expect(container.firstChild).toHaveAttribute('data-phase', 'complete');
  });

  it('resets to idle if isSpinning becomes false before completion', async () => {
    const onSpinComplete = vi.fn();
    const { container, rerender } = render(
      <WheelSpinEffects isSpinning={true} targetAngle={90} onSpinComplete={onSpinComplete} />
    );
    expect(container.firstChild).toHaveAttribute('data-phase', 'decelerating');

    rerender(<WheelSpinEffects isSpinning={false} targetAngle={90} onSpinComplete={onSpinComplete} />);
    expect(container.firstChild).toHaveAttribute('data-phase', 'idle');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(onSpinComplete).not.toHaveBeenCalled();
  });

  it('completes instantly (0ms) when prefers-reduced-motion is set', async () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);

    const onSpinComplete = vi.fn();
    const { rerender } = render(
      <WheelSpinEffects isSpinning={false} targetAngle={45} onSpinComplete={onSpinComplete} />
    );
    rerender(<WheelSpinEffects isSpinning={true} targetAngle={45} onSpinComplete={onSpinComplete} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(onSpinComplete).toHaveBeenCalledTimes(1);
  });

  it('rotates the glow element to the target angle', () => {
    const { getByTestId, rerender } = render(
      <WheelSpinEffects isSpinning={false} targetAngle={270} onSpinComplete={vi.fn()} />
    );
    rerender(<WheelSpinEffects isSpinning={true} targetAngle={270} onSpinComplete={vi.fn()} />);
    expect(getByTestId('wse-glow')).toHaveStyle({ transform: 'rotate(270deg)' });
  });
});
