import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SlippageSettingsModal, validateSlippage, validateCustomFee } from './SlippageSettingsModal';
import { DEFAULT_TX_SETTINGS } from './types';
import type { TxSettings } from './types';

const baseSettings: TxSettings = {
  feeTier: 'base',
  slippageTolerancePct: 0.5,
  deadlineMinutes: 10,
};

describe('validateSlippage', () => {
  it('rejects negative slippage', () => {
    expect(validateSlippage(-1)).toBe('Slippage cannot be negative');
  });

  it('rejects slippage above 50%', () => {
    expect(validateSlippage(51)).toMatch(/cannot exceed/);
  });

  it('rejects NaN', () => {
    expect(validateSlippage(NaN)).toBe('Slippage must be a number');
  });

  it('accepts a valid slippage value', () => {
    expect(validateSlippage(1)).toBeUndefined();
  });

  it('accepts the boundary value of 0', () => {
    expect(validateSlippage(0)).toBeUndefined();
  });

  it('accepts the boundary value of 50', () => {
    expect(validateSlippage(50)).toBeUndefined();
  });
});

describe('validateCustomFee', () => {
  it('rejects a fee below the minimum', () => {
    expect(validateCustomFee(10)).toMatch(/at least/);
  });

  it('rejects a fee above the maximum', () => {
    expect(validateCustomFee(50_000_000)).toMatch(/cannot exceed/);
  });

  it('rejects NaN', () => {
    expect(validateCustomFee(NaN)).toBe('Custom fee must be a number');
  });

  it('accepts a valid fee', () => {
    expect(validateCustomFee(500)).toBeUndefined();
  });
});

describe('SlippageSettingsModal', () => {
  it('renders when isOpen is true', () => {
    render(
      <SlippageSettingsModal
        isOpen={true}
        initialSettings={baseSettings}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('slippage-settings-modal')).toBeInTheDocument();
    expect(screen.getByText('Transaction Settings')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <SlippageSettingsModal
        isOpen={false}
        initialSettings={baseSettings}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByTestId('slippage-settings-modal')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <SlippageSettingsModal
        isOpen={true}
        initialSettings={baseSettings}
        onSave={vi.fn()}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByTestId('slippage-settings-modal-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(
      <SlippageSettingsModal
        isOpen={true}
        initialSettings={baseSettings}
        onSave={vi.fn()}
        onClose={onClose}
      />
    );

    const backdrop = screen
      .getByTestId('slippage-settings-modal')
      .querySelector('.slippage-settings-modal__backdrop');
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when ESC key is pressed', () => {
    const onClose = vi.fn();
    render(
      <SlippageSettingsModal
        isOpen={true}
        initialSettings={baseSettings}
        onSave={vi.fn()}
        onClose={onClose}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  describe('fee tier selection', () => {
    it('marks base as active by default', () => {
      render(
        <SlippageSettingsModal
          isOpen={true}
          initialSettings={baseSettings}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByTestId('slippage-settings-modal-fee-tier-base')).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });

    it('updates active state when selecting fast tier', () => {
      render(
        <SlippageSettingsModal
          isOpen={true}
          initialSettings={baseSettings}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      fireEvent.click(screen.getByTestId('slippage-settings-modal-fee-tier-fast'));
      expect(screen.getByTestId('slippage-settings-modal-fee-tier-fast')).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      expect(screen.getByTestId('slippage-settings-modal-fee-tier-base')).toHaveAttribute(
        'aria-pressed',
        'false'
      );
    });

    it('shows a custom fee input when custom tier is selected', () => {
      render(
        <SlippageSettingsModal
          isOpen={true}
          initialSettings={baseSettings}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      fireEvent.click(screen.getByTestId('slippage-settings-modal-fee-tier-custom'));
      expect(screen.getByTestId('slippage-settings-modal-custom-fee-input')).toBeInTheDocument();
    });

    it('shows a validation error for a custom fee below the minimum', () => {
      render(
        <SlippageSettingsModal
          isOpen={true}
          initialSettings={baseSettings}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      fireEvent.click(screen.getByTestId('slippage-settings-modal-fee-tier-custom'));
      fireEvent.change(screen.getByTestId('slippage-settings-modal-custom-fee-input'), {
        target: { value: '10' },
      });

      expect(screen.getByText(/at least/)).toBeInTheDocument();
    });
  });

  describe('slippage tolerance selection', () => {
    it('updates active state when a preset chip is clicked', () => {
      render(
        <SlippageSettingsModal
          isOpen={true}
          initialSettings={baseSettings}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      fireEvent.click(screen.getByTestId('slippage-settings-modal-slippage-preset-1'));
      expect(screen.getByTestId('slippage-settings-modal-slippage-preset-1')).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });

    it('shows a custom input when the Custom chip is activated', () => {
      render(
        <SlippageSettingsModal
          isOpen={true}
          initialSettings={baseSettings}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      fireEvent.click(screen.getByTestId('slippage-settings-modal-slippage-custom-toggle'));
      expect(screen.getByTestId('slippage-settings-modal-custom-slippage-input')).toBeInTheDocument();
    });

    it('shows a boundary validation error for negative custom slippage', () => {
      render(
        <SlippageSettingsModal
          isOpen={true}
          initialSettings={baseSettings}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      fireEvent.click(screen.getByTestId('slippage-settings-modal-slippage-custom-toggle'));
      fireEvent.change(screen.getByTestId('slippage-settings-modal-custom-slippage-input'), {
        target: { value: '-5' },
      });

      expect(screen.getByText('Slippage cannot be negative')).toBeInTheDocument();
    });

    it('shows a boundary validation error for slippage over 50%', () => {
      render(
        <SlippageSettingsModal
          isOpen={true}
          initialSettings={baseSettings}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      fireEvent.click(screen.getByTestId('slippage-settings-modal-slippage-custom-toggle'));
      fireEvent.change(screen.getByTestId('slippage-settings-modal-custom-slippage-input'), {
        target: { value: '75' },
      });

      expect(screen.getByText(/cannot exceed 50%/)).toBeInTheDocument();
    });

    it('shows a high-slippage warning above 5%', () => {
      render(
        <SlippageSettingsModal
          isOpen={true}
          initialSettings={baseSettings}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      fireEvent.click(screen.getByTestId('slippage-settings-modal-slippage-custom-toggle'));
      fireEvent.change(screen.getByTestId('slippage-settings-modal-custom-slippage-input'), {
        target: { value: '10' },
      });

      expect(screen.getByTestId('slippage-settings-modal-high-slippage-warning')).toBeInTheDocument();
    });

    it('does not show a high-slippage warning at or below 5%', () => {
      render(
        <SlippageSettingsModal
          isOpen={true}
          initialSettings={baseSettings}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      fireEvent.click(screen.getByTestId('slippage-settings-modal-slippage-preset-1'));
      expect(
        screen.queryByTestId('slippage-settings-modal-high-slippage-warning')
      ).not.toBeInTheDocument();
    });
  });

  describe('deadline selection', () => {
    it('renders all deadline options', () => {
      render(
        <SlippageSettingsModal
          isOpen={true}
          initialSettings={baseSettings}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const select = screen.getByTestId('slippage-settings-modal-deadline-select') as HTMLSelectElement;
      expect(select.options).toHaveLength(3);
    });

    it('updates settings when a different deadline is selected', () => {
      render(
        <SlippageSettingsModal
          isOpen={true}
          initialSettings={baseSettings}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const select = screen.getByTestId('slippage-settings-modal-deadline-select') as HTMLSelectElement;
      fireEvent.change(select, { target: { value: '20' } });
      expect(select.value).toBe('20');
    });
  });

  describe('reset and save', () => {
    it('resets fields to defaults when Reset is clicked', () => {
      render(
        <SlippageSettingsModal
          isOpen={true}
          initialSettings={{ feeTier: 'fast', slippageTolerancePct: 10, deadlineMinutes: 20 }}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      );

      fireEvent.click(screen.getByTestId('slippage-settings-modal-reset'));

      expect(screen.getByTestId('slippage-settings-modal-fee-tier-base')).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      expect(
        screen.getByTestId(`slippage-settings-modal-slippage-preset-${DEFAULT_TX_SETTINGS.slippageTolerancePct}`)
      ).toHaveAttribute('aria-pressed', 'true');
    });

    it('calls onSave with current settings and closes on Save', () => {
      const onSave = vi.fn();
      const onClose = vi.fn();
      render(
        <SlippageSettingsModal
          isOpen={true}
          initialSettings={baseSettings}
          onSave={onSave}
          onClose={onClose}
        />
      );

      fireEvent.click(screen.getByTestId('slippage-settings-modal-slippage-preset-1'));
      fireEvent.click(screen.getByTestId('slippage-settings-modal-save'));

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ slippageTolerancePct: 1 })
      );
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onSave when there is a blocking validation error', () => {
      const onSave = vi.fn();
      render(
        <SlippageSettingsModal
          isOpen={true}
          initialSettings={baseSettings}
          onSave={onSave}
          onClose={vi.fn()}
        />
      );

      fireEvent.click(screen.getByTestId('slippage-settings-modal-slippage-custom-toggle'));
      fireEvent.change(screen.getByTestId('slippage-settings-modal-custom-slippage-input'), {
        target: { value: '-1' },
      });

      const saveButton = screen.getByTestId('slippage-settings-modal-save');
      expect(saveButton).toBeDisabled();

      fireEvent.click(saveButton);
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  it('re-syncs local state when reopened with different initialSettings', () => {
    const { rerender } = render(
      <SlippageSettingsModal
        isOpen={false}
        initialSettings={baseSettings}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );

    rerender(
      <SlippageSettingsModal
        isOpen={true}
        initialSettings={{ feeTier: 'fast', slippageTolerancePct: 1, deadlineMinutes: 20 }}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('slippage-settings-modal-fee-tier-fast')).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });
});
