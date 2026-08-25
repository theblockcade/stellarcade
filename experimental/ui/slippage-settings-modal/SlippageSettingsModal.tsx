'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  SlippageSettingsModalProps,
  TxSettings,
  FeeTier,
  ValidationErrors,
  DEFAULT_TX_SETTINGS,
  SLIPPAGE_PRESETS,
  DEADLINE_OPTIONS,
  MIN_SLIPPAGE_PCT,
  MAX_SLIPPAGE_PCT,
  HIGH_SLIPPAGE_WARNING_THRESHOLD_PCT,
  BASE_FEE_STROOPS,
  FAST_FEE_MULTIPLIER,
  MIN_CUSTOM_FEE_STROOPS,
  MAX_CUSTOM_FEE_STROOPS,
} from './types';
import './SlippageSettingsModal.css';

const FEE_TIERS: { id: FeeTier; label: string; description: string }[] = [
  { id: 'base', label: 'Base', description: `Standard fee (${BASE_FEE_STROOPS} stroops)` },
  {
    id: 'fast',
    label: 'Fast',
    description: `${FAST_FEE_MULTIPLIER}x fee (${Math.round(BASE_FEE_STROOPS * FAST_FEE_MULTIPLIER)} stroops)`,
  },
  { id: 'custom', label: 'Custom', description: 'Set your own fee in stroops' },
];

/**
 * Validates a slippage tolerance percentage.
 * Returns an error message, or undefined when valid.
 */
export function validateSlippage(value: number): string | undefined {
  if (Number.isNaN(value)) {
    return 'Slippage must be a number';
  }
  if (value < MIN_SLIPPAGE_PCT) {
    return 'Slippage cannot be negative';
  }
  if (value > MAX_SLIPPAGE_PCT) {
    return `Slippage cannot exceed ${MAX_SLIPPAGE_PCT}%`;
  }
  return undefined;
}

/**
 * Validates a custom fee value in stroops.
 * Returns an error message, or undefined when valid.
 */
export function validateCustomFee(value: number): string | undefined {
  if (Number.isNaN(value)) {
    return 'Custom fee must be a number';
  }
  if (value < MIN_CUSTOM_FEE_STROOPS) {
    return `Custom fee must be at least ${MIN_CUSTOM_FEE_STROOPS} stroops`;
  }
  if (value > MAX_CUSTOM_FEE_STROOPS) {
    return `Custom fee cannot exceed ${MAX_CUSTOM_FEE_STROOPS} stroops`;
  }
  return undefined;
}

export const SlippageSettingsModal: React.FC<SlippageSettingsModalProps> = ({
  isOpen,
  initialSettings,
  onSave,
  onClose,
  className = '',
  testId = 'slippage-settings-modal',
}) => {
  const [settings, setSettings] = useState<TxSettings>(initialSettings);
  const [customSlippageInput, setCustomSlippageInput] = useState<string>('');
  const [isCustomSlippageActive, setIsCustomSlippageActive] = useState<boolean>(
    !SLIPPAGE_PRESETS.includes(initialSettings.slippageTolerancePct)
  );
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Re-sync local state whenever the modal is (re)opened with fresh settings.
  useEffect(() => {
    if (isOpen) {
      setSettings(initialSettings);
      const presetMatch = SLIPPAGE_PRESETS.includes(initialSettings.slippageTolerancePct);
      setIsCustomSlippageActive(!presetMatch);
      setCustomSlippageInput(presetMatch ? '' : String(initialSettings.slippageTolerancePct));
      setErrors({});
    }
  }, [isOpen, initialSettings]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleFeeTierSelect = useCallback((tier: FeeTier) => {
    setSettings((prev) => ({ ...prev, feeTier: tier }));
    if (tier !== 'custom') {
      setErrors((prev) => ({ ...prev, customFee: undefined }));
    }
  }, []);

  const handleCustomFeeChange = useCallback((raw: string) => {
    const parsed = Number(raw);
    setSettings((prev) => ({ ...prev, customFeeStroops: parsed }));
    setErrors((prev) => ({ ...prev, customFee: validateCustomFee(parsed) }));
  }, []);

  const handleSlippagePresetSelect = useCallback((pct: number) => {
    setIsCustomSlippageActive(false);
    setCustomSlippageInput('');
    setSettings((prev) => ({ ...prev, slippageTolerancePct: pct }));
    setErrors((prev) => ({ ...prev, slippage: validateSlippage(pct) }));
  }, []);

  const handleCustomSlippageChange = useCallback((raw: string) => {
    setCustomSlippageInput(raw);
    const parsed = Number(raw);
    setSettings((prev) => ({ ...prev, slippageTolerancePct: parsed }));
    setErrors((prev) => ({ ...prev, slippage: validateSlippage(parsed) }));
  }, []);

  const handleActivateCustomSlippage = useCallback(() => {
    setIsCustomSlippageActive(true);
    setCustomSlippageInput(String(settings.slippageTolerancePct));
  }, [settings.slippageTolerancePct]);

  const handleDeadlineSelect = useCallback((minutes: number) => {
    setSettings((prev) => ({ ...prev, deadlineMinutes: minutes }));
  }, []);

  const handleReset = useCallback(() => {
    setSettings(DEFAULT_TX_SETTINGS);
    setIsCustomSlippageActive(false);
    setCustomSlippageInput('');
    setErrors({});
  }, []);

  const isHighSlippage = settings.slippageTolerancePct > HIGH_SLIPPAGE_WARNING_THRESHOLD_PCT;

  const hasBlockingErrors = useMemo(() => {
    const slippageError = validateSlippage(settings.slippageTolerancePct);
    const customFeeError =
      settings.feeTier === 'custom' ? validateCustomFee(settings.customFeeStroops ?? NaN) : undefined;
    return Boolean(slippageError || customFeeError);
  }, [settings]);

  const handleSave = useCallback(() => {
    const slippageError = validateSlippage(settings.slippageTolerancePct);
    const customFeeError =
      settings.feeTier === 'custom' ? validateCustomFee(settings.customFeeStroops ?? NaN) : undefined;

    if (slippageError || customFeeError) {
      setErrors({ slippage: slippageError, customFee: customFeeError });
      return;
    }

    onSave(settings);
    onClose();
  }, [settings, onSave, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`slippage-settings-modal ${className}`}
      data-testid={testId}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${testId}-title`}
    >
      <div className="slippage-settings-modal__backdrop" onClick={onClose} />

      <div className="slippage-settings-modal__content" role="document">
        <button
          className="slippage-settings-modal__close"
          onClick={onClose}
          aria-label="Close modal"
          data-testid={`${testId}-close`}
        >
          ×
        </button>

        <h2 id={`${testId}-title`} className="slippage-settings-modal__title">
          Transaction Settings
        </h2>

        <section className="slippage-settings-modal__section">
          <h3 className="slippage-settings-modal__section-title">Priority Fee</h3>
          <div className="slippage-settings-modal__chip-row" role="group" aria-label="Priority fee tier">
            {FEE_TIERS.map((tier) => (
              <button
                key={tier.id}
                className={`slippage-settings-modal__chip ${
                  settings.feeTier === tier.id ? 'slippage-settings-modal__chip--active' : ''
                }`}
                onClick={() => handleFeeTierSelect(tier.id)}
                aria-pressed={settings.feeTier === tier.id}
                data-testid={`${testId}-fee-tier-${tier.id}`}
              >
                <span className="slippage-settings-modal__chip-label">{tier.label}</span>
                <span className="slippage-settings-modal__chip-description">{tier.description}</span>
              </button>
            ))}
          </div>

          {settings.feeTier === 'custom' && (
            <div className="slippage-settings-modal__custom-input">
              <label htmlFor={`${testId}-custom-fee-input`}>Custom fee (stroops)</label>
              <input
                id={`${testId}-custom-fee-input`}
                type="number"
                min={MIN_CUSTOM_FEE_STROOPS}
                max={MAX_CUSTOM_FEE_STROOPS}
                value={settings.customFeeStroops ?? ''}
                onChange={(e) => handleCustomFeeChange(e.target.value)}
                data-testid={`${testId}-custom-fee-input`}
                aria-invalid={Boolean(errors.customFee)}
              />
              {errors.customFee && (
                <p className="slippage-settings-modal__error" role="alert">
                  {errors.customFee}
                </p>
              )}
            </div>
          )}
        </section>

        <section className="slippage-settings-modal__section">
          <h3 className="slippage-settings-modal__section-title">Slippage Tolerance</h3>
          <div className="slippage-settings-modal__chip-row" role="group" aria-label="Slippage tolerance">
            {SLIPPAGE_PRESETS.map((pct) => (
              <button
                key={pct}
                className={`slippage-settings-modal__chip ${
                  !isCustomSlippageActive && settings.slippageTolerancePct === pct
                    ? 'slippage-settings-modal__chip--active'
                    : ''
                }`}
                onClick={() => handleSlippagePresetSelect(pct)}
                aria-pressed={!isCustomSlippageActive && settings.slippageTolerancePct === pct}
                data-testid={`${testId}-slippage-preset-${pct}`}
              >
                {pct}%
              </button>
            ))}
            <button
              className={`slippage-settings-modal__chip ${
                isCustomSlippageActive ? 'slippage-settings-modal__chip--active' : ''
              }`}
              onClick={handleActivateCustomSlippage}
              aria-pressed={isCustomSlippageActive}
              data-testid={`${testId}-slippage-custom-toggle`}
            >
              Custom
            </button>
          </div>

          {isCustomSlippageActive && (
            <div className="slippage-settings-modal__custom-input">
              <label htmlFor={`${testId}-custom-slippage-input`}>Custom slippage (%)</label>
              <input
                id={`${testId}-custom-slippage-input`}
                type="number"
                min={MIN_SLIPPAGE_PCT}
                max={MAX_SLIPPAGE_PCT}
                step="0.1"
                value={customSlippageInput}
                onChange={(e) => handleCustomSlippageChange(e.target.value)}
                data-testid={`${testId}-custom-slippage-input`}
                aria-invalid={Boolean(errors.slippage)}
              />
              {errors.slippage && (
                <p className="slippage-settings-modal__error" role="alert">
                  {errors.slippage}
                </p>
              )}
            </div>
          )}

          {isHighSlippage && !errors.slippage && (
            <div className="slippage-settings-modal__warning" role="alert" data-testid={`${testId}-high-slippage-warning`}>
              ⚠ High slippage tolerance. Your wager or swap may be executed at a significantly
              worse price than expected.
            </div>
          )}

          <p className="slippage-settings-modal__explainer">
            Slippage tolerance sets how much the final wager or swap price can move against you
            before the transaction is rejected. Lower values protect against unfavorable price
            movement but may cause more failed transactions during volatility.
          </p>
        </section>

        <section className="slippage-settings-modal__section">
          <h3 className="slippage-settings-modal__section-title">Transaction Deadline</h3>
          <select
            className="slippage-settings-modal__select"
            value={settings.deadlineMinutes}
            onChange={(e) => handleDeadlineSelect(Number(e.target.value))}
            data-testid={`${testId}-deadline-select`}
            aria-label="Transaction deadline"
          >
            {DEADLINE_OPTIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} min
              </option>
            ))}
          </select>
        </section>

        <div className="slippage-settings-modal__actions">
          <button
            className="slippage-settings-modal__action-btn"
            onClick={handleReset}
            data-testid={`${testId}-reset`}
          >
            Reset to Defaults
          </button>
          <button
            className="slippage-settings-modal__action-btn slippage-settings-modal__action-btn--primary"
            onClick={handleSave}
            disabled={hasBlockingErrors}
            data-testid={`${testId}-save`}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

SlippageSettingsModal.displayName = 'SlippageSettingsModal';
export default SlippageSettingsModal;
