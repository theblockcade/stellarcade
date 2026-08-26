import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { VictoryConfettiOverlay, formatPrizeAmount } from './VictoryConfettiOverlay';

describe('VictoryConfettiOverlay', () => {
  it('formats prize amount with 2 decimals and currency symbol', () => {
    expect(formatPrizeAmount(100, 'XLM')).toBe('100.00 XLM');
    expect(formatPrizeAmount(250.5, 'ARCADE')).toBe('250.50 ARCADE');
  });

  it('renders correctly when isOpen is true', () => {
    render(
      <VictoryConfettiOverlay
        isOpen={true}
        prizeAmount={500}
        currencySymbol="XLM"
        gameTitle="Stellar Slots"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('victory-confetti-overlay')).toBeDefined();
    expect(screen.getByText('VICTORY!')).toBeDefined();
    expect(screen.getByText('Stellar Slots')).toBeDefined();
    expect(screen.getByTestId('prize-odometer')).toBeDefined();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <VictoryConfettiOverlay
        isOpen={false}
        prizeAmount={500}
        currencySymbol="XLM"
        gameTitle="Stellar Slots"
        onClose={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('triggers close and play again callbacks', () => {
    const onCloseMock = vi.fn();
    const onPlayAgainMock = vi.fn();

    render(
      <VictoryConfettiOverlay
        isOpen={true}
        prizeAmount={500}
        currencySymbol="XLM"
        gameTitle="Stellar Slots"
        onClose={onCloseMock}
        onPlayAgain={onPlayAgainMock}
      />
    );

    const closeBtn = screen.getByTestId('close-overlay-btn');
    fireEvent.click(closeBtn);
    expect(onCloseMock).toHaveBeenCalledTimes(1);

    const playAgainBtn = screen.getByTestId('play-again-btn');
    fireEvent.click(playAgainBtn);
    expect(onPlayAgainMock).toHaveBeenCalledTimes(1);
  });

  it('handles ESC keypress to dismiss modal', () => {
    const onCloseMock = vi.fn();

    render(
      <VictoryConfettiOverlay
        isOpen={true}
        prizeAmount={500}
        currencySymbol="XLM"
        gameTitle="Stellar Slots"
        onClose={onCloseMock}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
