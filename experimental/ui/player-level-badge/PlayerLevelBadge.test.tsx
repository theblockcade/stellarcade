import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { PlayerLevelBadge, getTierForLevel, calculateTierProgress } from './PlayerLevelBadge';

describe('calculateTierProgress', () => {
  it('returns 0 at the start of a level', () => {
    expect(calculateTierProgress(1000, 1000, 2000)).toBe(0);
  });

  it('returns 1 at the end of a level', () => {
    expect(calculateTierProgress(2000, 1000, 2000)).toBe(1);
  });

  it('returns a fraction for partial progress', () => {
    expect(calculateTierProgress(1450, 1000, 2000)).toBeCloseTo(0.45);
  });

  it('clamps values above 100% to 1', () => {
    expect(calculateTierProgress(5000, 1000, 2000)).toBe(1);
  });

  it('clamps values below 0% to 0', () => {
    expect(calculateTierProgress(500, 1000, 2000)).toBe(0);
  });

  it('returns 0 for a malformed zero-or-negative span instead of dividing by zero', () => {
    expect(calculateTierProgress(1000, 1000, 1000)).toBe(0);
    expect(calculateTierProgress(1000, 2000, 1000)).toBe(0);
  });
});

describe('getTierForLevel', () => {
  it('assigns Bronze for levels 1-10', () => {
    expect(getTierForLevel(1)).toBe('Bronze');
    expect(getTierForLevel(10)).toBe('Bronze');
  });

  it('assigns Silver for levels 11-25', () => {
    expect(getTierForLevel(11)).toBe('Silver');
    expect(getTierForLevel(25)).toBe('Silver');
  });

  it('assigns Gold for levels 26-50', () => {
    expect(getTierForLevel(26)).toBe('Gold');
    expect(getTierForLevel(50)).toBe('Gold');
  });

  it('assigns Diamond for levels above 50', () => {
    expect(getTierForLevel(51)).toBe('Diamond');
    expect(getTierForLevel(200)).toBe('Diamond');
  });
});

describe('PlayerLevelBadge', () => {
  it('renders the level number', () => {
    render(
      <PlayerLevelBadge currentXp={1450} xpForCurrentLevel={1000} xpForNextLevel={2000} level={14} />
    );
    expect(screen.getByText('14')).toBeInTheDocument();
  });

  it('exposes accessible aria attributes describing level and progress', () => {
    render(
      <PlayerLevelBadge currentXp={1500} xpForCurrentLevel={1000} xpForNextLevel={2000} level={14} />
    );
    const el = screen.getByRole('img', { name: /Level 14, Silver tier, 50% progress/i });
    expect(el).toBeInTheDocument();
  });

  it('shows a tooltip with formatted XP content on hover', () => {
    render(
      <PlayerLevelBadge currentXp={1450} xpForCurrentLevel={1000} xpForNextLevel={2000} level={14} />
    );
    const container = screen.getByRole('img');
    fireEvent.mouseEnter(container);
    expect(screen.getByRole('tooltip')).toHaveTextContent(
      'Current XP: 1,450 / 2,000 XP (550 XP to Level 15)'
    );
  });

  it('hides the tooltip on mouse leave', () => {
    render(
      <PlayerLevelBadge currentXp={1450} xpForCurrentLevel={1000} xpForNextLevel={2000} level={14} />
    );
    const container = screen.getByRole('img');
    fireEvent.mouseEnter(container);
    fireEvent.mouseLeave(container);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('assigns the correct tier icon based on level bracket', () => {
    const { rerender } = render(
      <PlayerLevelBadge currentXp={0} xpForCurrentLevel={0} xpForNextLevel={100} level={5} />
    );
    expect(screen.getByRole('img', { name: /Bronze tier/i })).toBeInTheDocument();

    rerender(
      <PlayerLevelBadge currentXp={0} xpForCurrentLevel={0} xpForNextLevel={100} level={60} />
    );
    expect(screen.getByRole('img', { name: /Diamond tier/i })).toBeInTheDocument();
  });

  it('renders at the requested size', () => {
    const { container } = render(
      <PlayerLevelBadge currentXp={0} xpForCurrentLevel={0} xpForNextLevel={100} level={1} size="lg" />
    );
    expect(container.querySelector('.plb-lg')).not.toBeNull();
  });
});
