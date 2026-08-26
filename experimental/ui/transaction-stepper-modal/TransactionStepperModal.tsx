import React from 'react';
import { TransactionStepperModalProps } from './types';
import { StepIndicator } from './StepIndicator';

export const getStellarExpertUrl = (txHash: string, network: 'public' | 'testnet' = 'public'): string => {
  return `https://stellar.expert/explorer/${network}/tx/${txHash}`;
};

export const TransactionStepperModal: React.FC<TransactionStepperModalProps> = ({
  isOpen,
  steps,
  currentStepIndex,
  onRetry,
  onCancel,
  network = 'public',
}) => {
  if (!isOpen) return null;

  const currentStep = steps[currentStepIndex] || steps[steps.length - 1];
  const hasFailedStep = steps.some((s) => s.status === 'failed');
  const isAllComplete = steps.every((s) => s.status === 'complete');
  const failedStep = steps.find((s) => s.status === 'failed');

  return (
    <div className="stepper-modal-backdrop" data-testid="stepper-modal">
      <div className="stepper-modal-container">
        <header className="stepper-modal-header">
          <h2>Transaction Progress</h2>
          <button className="close-btn" onClick={onCancel} aria-label="Cancel">
            ✕
          </button>
        </header>

        <div className="stepper-step-counter">
          Step {Math.min(currentStepIndex + 1, steps.length)} of {steps.length}: {currentStep?.description}
        </div>

        <div className="stepper-indicators-list">
          {steps.map((step, idx) => (
            <StepIndicator key={step.id} step={step} index={idx} totalSteps={steps.length} />
          ))}
        </div>

        {hasFailedStep && (
          <div className="stepper-error-panel" data-testid="error-panel">
            <div className="error-message">
              {failedStep?.errorMessage || `Transaction failed at step "${failedStep?.label}".`}
            </div>
            <button className="retry-btn" onClick={onRetry} data-testid="retry-button">
              Retry This Step
            </button>
          </div>
        )}

        {isAllComplete && (
          <div className="stepper-success-panel" data-testid="success-panel">
            <h3>Transaction Complete!</h3>
            {steps
              .filter((s) => s.txHash)
              .map((s) => (
                <div key={s.id} className="tx-link-row">
                  <span>{s.label}: </span>
                  <a
                    href={getStellarExpertUrl(s.txHash!, network)}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`tx-link-${s.id}`}
                  >
                    View on Stellar Expert ({s.txHash?.substring(0, 8)}...)
                  </a>
                </div>
              ))}
          </div>
        )}

        <footer className="stepper-modal-footer">
          {!isAllComplete && (
            <button className="cancel-btn" onClick={onCancel} data-testid="cancel-button">
              Cancel
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};
