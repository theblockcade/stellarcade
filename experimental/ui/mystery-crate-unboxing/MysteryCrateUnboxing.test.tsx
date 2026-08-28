import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { MysteryCrateUnboxing, formatRewardValue } from './MysteryCrateUnboxing';
import type { UnboxedReward } from './types';

afterEach(() => {
  cleanup();
});

const XP_REWARD: UnboxedReward = { kind: 'xp', rarity: 'common', amount: 250 };
const NFT_REWARD: UnboxedReward = { kind: 'nft_badge', rarity: 'legendary', badgeName: 'Golden Ace' };

function renderCrate(overrides: Partial<React.ComponentProps<typeof MysteryCrateUnboxing>> = {}) {
  const onOpenCrate = vi.fn().mockResolvedValue(undefined);
  const onClaim = vi.fn();
  const onClose = vi.fn();
  const utils = render(
    <MysteryCrateUnboxing
      isOpen={true}
      onOpenCrate={onOpenCrate}
      onClaim={onClaim}
      onClose={onClose}
      {...overrides}
    />,
  );
  return { ...utils, onOpenCrate, onClaim, onClose };
}

describe('formatRewardValue', () => {
  it('formats an XP/XLM reward with its amount and unit', () => {
    expect(formatRewardValue('xp', 250)).toBe('250 XP');
    expect(formatRewardValue('xlm', 10.5)).toBe('10.5 XLM');
  });

  it('formats an NFT badge reward using its badge name', () => {
    expect(formatRewardValue('nft_badge', undefined, 'Golden Ace')).toBe('Golden Ace');
  });
});

describe('MysteryCrateUnboxing — rendering', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = renderCrate({ isOpen: false });
    expect(container.firstChild).toBeNull();
  });

  it('starts in the idle state with a prompt to open', () => {
    renderCrate();
    expect(screen.getByTestId('crate-canvas').getAttribute('data-state')).toBe('idle');
    expect(screen.getByTestId('crate-idle-prompt')).toBeDefined();
  });
});

describe('MysteryCrateUnboxing — state transitions', () => {
  it('transitions idle -> opening when clicked', async () => {
    const { onOpenCrate } = renderCrate();
    fireEvent.click(screen.getByTestId('mystery-crate-trigger'));
    expect(screen.getByTestId('crate-canvas').getAttribute('data-state')).toBe('opening');
    expect(onOpenCrate).toHaveBeenCalledTimes(1);
  });

  it('transitions opening -> opened once the reward prop is provided', async () => {
    const { rerender } = renderCrate();
    fireEvent.click(screen.getByTestId('mystery-crate-trigger'));
    expect(screen.getByTestId('crate-canvas').getAttribute('data-state')).toBe('opening');

    rerender(
      <MysteryCrateUnboxing
        isOpen={true}
        reward={XP_REWARD}
        onOpenCrate={vi.fn().mockResolvedValue(undefined)}
        onClaim={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('crate-canvas').getAttribute('data-state')).toBe('opened');
    });
    expect(screen.getByTestId('reward-summary-card')).toBeDefined();
  });

  it('does not re-trigger onOpenCrate while already opening', () => {
    const { onOpenCrate } = renderCrate();
    const trigger = screen.getByTestId('mystery-crate-trigger');
    fireEvent.click(trigger);
    fireEvent.click(trigger);
    expect(onOpenCrate).toHaveBeenCalledTimes(1);
  });

  it('resets to idle when "Open Another" is clicked from the opened state', async () => {
    renderCrate({ reward: XP_REWARD });
    fireEvent.click(screen.getByTestId('mystery-crate-trigger'));
    await waitFor(() => {
      expect(screen.getByTestId('crate-canvas').getAttribute('data-state')).toBe('opened');
    });

    fireEvent.click(screen.getByTestId('open-another-btn'));
    expect(screen.getByTestId('crate-canvas').getAttribute('data-state')).toBe('idle');
  });

  it('resets to idle when the overlay is reopened (isOpen toggled)', async () => {
    const { rerender } = renderCrate({ reward: XP_REWARD });
    fireEvent.click(screen.getByTestId('mystery-crate-trigger'));
    await waitFor(() => {
      expect(screen.getByTestId('crate-canvas').getAttribute('data-state')).toBe('opened');
    });

    rerender(
      <MysteryCrateUnboxing
        isOpen={false}
        reward={XP_REWARD}
        onOpenCrate={vi.fn().mockResolvedValue(undefined)}
        onClaim={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    rerender(
      <MysteryCrateUnboxing
        isOpen={true}
        reward={XP_REWARD}
        onOpenCrate={vi.fn().mockResolvedValue(undefined)}
        onClaim={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByTestId('crate-canvas').getAttribute('data-state')).toBe('idle');
  });
});

describe('MysteryCrateUnboxing — reward summary and claim', () => {
  it('displays the reward rarity and value once opened', async () => {
    renderCrate({ reward: NFT_REWARD });
    fireEvent.click(screen.getByTestId('mystery-crate-trigger'));
    await waitFor(() => screen.getByTestId('reward-summary-card'));

    expect(screen.getByTestId('reward-rarity-label').textContent).toBe('LEGENDARY');
    expect(screen.getByTestId('reward-value').textContent).toBe('Golden Ace');
  });

  it('calls onClaim when the claim button is clicked', async () => {
    const { onClaim } = renderCrate({ reward: XP_REWARD });
    fireEvent.click(screen.getByTestId('mystery-crate-trigger'));
    await waitFor(() => screen.getByTestId('claim-reward-btn'));

    fireEvent.click(screen.getByTestId('claim-reward-btn'));
    expect(onClaim).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the close button is clicked', () => {
    const { onClose } = renderCrate();
    fireEvent.click(screen.getByTestId('mystery-crate-close-btn'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('MysteryCrateUnboxing — keyboard accessibility', () => {
  it('opens the crate on Enter key press', () => {
    const { onOpenCrate } = renderCrate();
    fireEvent.keyDown(screen.getByTestId('mystery-crate-trigger'), { key: 'Enter' });
    expect(onOpenCrate).toHaveBeenCalledTimes(1);
  });

  it('opens the crate on Space key press', () => {
    const { onOpenCrate } = renderCrate();
    fireEvent.keyDown(screen.getByTestId('mystery-crate-trigger'), { key: ' ' });
    expect(onOpenCrate).toHaveBeenCalledTimes(1);
  });

  it('ignores other key presses', () => {
    const { onOpenCrate } = renderCrate();
    fireEvent.keyDown(screen.getByTestId('mystery-crate-trigger'), { key: 'Tab' });
    expect(onOpenCrate).not.toHaveBeenCalled();
  });

  it('exposes the trigger as a focusable, labeled button role', () => {
    renderCrate();
    const trigger = screen.getByTestId('mystery-crate-trigger');
    expect(trigger.getAttribute('role')).toBe('button');
    expect(trigger.getAttribute('tabIndex')).toBe('0');
    expect(trigger.getAttribute('aria-label')).toBe('Open mystery crate');
  });
});
