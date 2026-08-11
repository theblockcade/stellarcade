"use client";

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useId,
} from 'react';
import './StagedConfirmationTray.css';

export type ConfirmationStage = 'review' | 'confirm' | 'done';
export type TrayRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type DoneOutcome = 'processing' | 'success' | 'error';

export interface ConfirmationField {
  label: string;
  value: React.ReactNode;
  sensitive?: boolean;
}

export interface StagedConfirmationTrayProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  fields: ConfirmationField[];
  riskLevel?: TrayRiskLevel;
  successMessage?: string;
  errorMessage?: string;
  className?: string;
  testId?: string;
}

const STAGE_LABELS: Record<ConfirmationStage, string> = {
  review: 'Review',
  confirm: 'Confirm',
  done: 'Done',
};

const STAGES: ConfirmationStage[] = ['review', 'confirm', 'done'];

export const StagedConfirmationTray: React.FC<StagedConfirmationTrayProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  fields,
  riskLevel = 'medium',
  successMessage = 'Action completed successfully.',
  errorMessage = 'Something went wrong. Please try again.',
  className = '',
  testId = 'staged-confirmation-tray',
}) => {
  const [stage, setStage] = useState<ConfirmationStage>('review');
  const [outcome, setOutcome] = useState<DoneOutcome>('processing');
  const [confirmed, setConfirmed] = useState(false);
  const trayRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (open) {
      setStage('review');
      setOutcome('processing');
      setConfirmed(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && stage !== 'done') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, stage, onClose]);

  useEffect(() => {
    if (open) trayRef.current?.focus();
  }, [open]);

  const handleProceedToConfirm = useCallback(() => setStage('confirm'), []);

  const handleSubmit = useCallback(async () => {
    setStage('done');
    setOutcome('processing');
    try {
      await onConfirm();
      setOutcome('success');
    } catch {
      setOutcome('error');
    }
  }, [onConfirm]);

  if (!open) return null;

  const stageIndex = STAGES.indexOf(stage);

  return (
    <div
      className="sct-backdrop"
      data-testid={`${testId}-backdrop`}
      onClick={(e) => {
        if (e.target === e.currentTarget && stage !== 'done') onClose();
      }}
    >
      <div
        ref={trayRef}
        className={`sct ${className}`}
        data-testid={testId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="sct__progress" aria-label="Confirmation stages" role="list">
          {STAGES.map((s, i) => (
            <div
              key={s}
              className={`sct__step ${i < stageIndex ? 'sct__step--done' : ''} ${i === stageIndex ? 'sct__step--active' : ''}`}
              role="listitem"
              aria-current={i === stageIndex ? 'step' : undefined}
            >
              <span className="sct__step-num" aria-hidden="true">{i + 1}</span>
              <span className="sct__step-label">{STAGE_LABELS[s]}</span>
            </div>
          ))}
        </div>

        <div className="sct__header">
          <h2 id={titleId} className="sct__title">{title}</h2>
          <span className={`sct__risk sct__risk--${riskLevel}`} data-testid={`${testId}-risk`}>
            {riskLevel} risk
          </span>
        </div>

        {stage === 'review' && (
          <div data-testid={`${testId}-stage-review`}>
            <dl className="sct__fields">
              {fields.map((f, i) => (
                <div key={i} className={`sct__field ${f.sensitive ? 'sct__field--sensitive' : ''}`}>
                  <dt className="sct__field-label">{f.label}</dt>
                  <dd className="sct__field-value">{f.value}</dd>
                </div>
              ))}
            </dl>
            <div className="sct__actions">
              <button type="button" className="sct__btn sct__btn--secondary" onClick={onClose} data-testid={`${testId}-cancel`}>
                Cancel
              </button>
              <button type="button" className="sct__btn sct__btn--primary" onClick={handleProceedToConfirm} data-testid={`${testId}-next`}>
                Continue
              </button>
            </div>
          </div>
        )}

        {stage === 'confirm' && (
          <div data-testid={`${testId}-stage-confirm`}>
            <p className="sct__confirm-prompt">
              Please confirm you have reviewed all details above and wish to proceed.
            </p>
            <label className="sct__checkbox-label">
              <input
                type="checkbox"
                className="sct__checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                data-testid={`${testId}-checkbox`}
              />
              I understand and want to submit
            </label>
            <div className="sct__actions">
              <button type="button" className="sct__btn sct__btn--secondary" onClick={() => setStage('review')} data-testid={`${testId}-back`}>
                Back
              </button>
              <button
                type="button"
                className="sct__btn sct__btn--primary"
                onClick={handleSubmit}
                disabled={!confirmed}
                data-testid={`${testId}-submit`}
                aria-disabled={!confirmed}
              >
                Submit
              </button>
            </div>
          </div>
        )}

        {stage === 'done' && (
          <div className="sct__done" data-testid={`${testId}-stage-done`}>
            {outcome === 'processing' && (
              <div className="sct__processing" role="status" aria-live="polite" aria-label="Processing">
                <span>Processing…</span>
              </div>
            )}
            {outcome === 'success' && (
              <div className="sct__outcome sct__outcome--success" role="status" aria-live="polite" data-testid={`${testId}-success`}>
                <span>{successMessage}</span>
              </div>
            )}
            {outcome === 'error' && (
              <div className="sct__outcome sct__outcome--error" role="alert" aria-live="assertive" data-testid={`${testId}-error`}>
                <span>{errorMessage}</span>
              </div>
            )}
            {outcome !== 'processing' && (
              <button type="button" className="sct__btn sct__btn--secondary" onClick={onClose} data-testid={`${testId}-close`}>
                Close
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

StagedConfirmationTray.displayName = 'StagedConfirmationTray';
export default StagedConfirmationTray;
