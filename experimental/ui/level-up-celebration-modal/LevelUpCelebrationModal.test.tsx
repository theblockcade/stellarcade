import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LevelUpCelebrationModal, clampProgressPercent } from './LevelUpCelebrationModal';

describe('clampProgressPercent', () => {
  it('computes a percentage between 0 and 100', () => {
    expect(clampProgressPercent(50, 200)).toBe(25);
    expect(clampProgressPercent(0, 200)).toBe(0);
    expect(clampProgressPercent(200, 200)).toBe(100);
  });

  it('clamps values outside the valid range', () => {
    expect(clampProgressPercent(300, 200)).toBe(100);
    expect(clampProgressPercent(-10, 200)).toBe(0);
  });

  it('returns 0 when xpForNextLevel is zero or negative', () => {
    expect(clampProgressPercent(50, 0)).toBe(0);
    expect(clampProgressPercent(50, -10)).toBe(0);
  });
});

describe('LevelUpCelebrationModal', () => {
  it('renders correctly when isOpen is true', () => {
    render(
      <LevelUpCelebrationModal
        isOpen={true}
        previousLevel={4}
        newLevel={5}
        xpIntoLevel={120}
        xpForNextLevel={500}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('level-up-celebration-modal')).toBeDefined();
    expect(screen.getByText('LEVEL UP!')).toBeDefined();
    expect(screen.getByTestId('level-up-old-badge').textContent).toBe('4');
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <LevelUpCelebrationModal
        isOpen={false}
        previousLevel={4}
        newLevel={5}
        xpIntoLevel={120}
        xpForNextLevel={500}
        onClose={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders unlocked perks when provided', () => {
    render(
      <LevelUpCelebrationModal
        isOpen={true}
        previousLevel={9}
        newLevel={10}
        xpIntoLevel={0}
        xpForNextLevel={1000}
        unlockedPerks={[{ label: 'Golden avatar frame', icon: '🖼️' }]}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('level-up-perks-list')).toBeDefined();
    expect(screen.getByText('Golden avatar frame')).toBeDefined();
  });

  it('does not render a perks list when none are provided', () => {
    render(
      <LevelUpCelebrationModal
        isOpen={true}
        previousLevel={1}
        newLevel={2}
        xpIntoLevel={10}
        xpForNextLevel={100}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByTestId('level-up-perks-list')).toBeNull();
  });

  it('triggers onClose when the close button is clicked', () => {
    const onCloseMock = vi.fn();
    render(
      <LevelUpCelebrationModal
        isOpen={true}
        previousLevel={4}
        newLevel={5}
        xpIntoLevel={120}
        xpForNextLevel={500}
        onClose={onCloseMock}
      />
    );

    fireEvent.click(screen.getByTestId('level-up-close-btn'));
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('triggers onClose when the Continue button is clicked', () => {
    const onCloseMock = vi.fn();
    render(
      <LevelUpCelebrationModal
        isOpen={true}
        previousLevel={4}
        newLevel={5}
        xpIntoLevel={120}
        xpForNextLevel={500}
        onClose={onCloseMock}
      />
    );

    fireEvent.click(screen.getByTestId('continue-btn'));
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('renders a share button only when onShare is provided', () => {
    const onShareMock = vi.fn();
    const { rerender } = render(
      <LevelUpCelebrationModal
        isOpen={true}
        previousLevel={4}
        newLevel={5}
        xpIntoLevel={120}
        xpForNextLevel={500}
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByTestId('share-x-btn')).toBeNull();

    rerender(
      <LevelUpCelebrationModal
        isOpen={true}
        previousLevel={4}
        newLevel={5}
        xpIntoLevel={120}
        xpForNextLevel={500}
        onClose={vi.fn()}
        onShare={onShareMock}
      />
    );

    fireEvent.click(screen.getByTestId('share-x-btn'));
    expect(onShareMock).toHaveBeenCalledWith('x');
  });

  it('closes on Escape key press', () => {
    const onCloseMock = vi.fn();
    render(
      <LevelUpCelebrationModal
        isOpen={true}
        previousLevel={4}
        newLevel={5}
        xpIntoLevel={120}
        xpForNextLevel={500}
        onClose={onCloseMock}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
