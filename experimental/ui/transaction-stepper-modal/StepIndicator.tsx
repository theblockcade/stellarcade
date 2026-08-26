import React from 'react';
import { TxStep } from './types';

export interface StepIndicatorProps {
  step: TxStep;
  index: number;
  totalSteps: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ step, index, totalSteps }) => {
  return (
    <div className={`step-indicator step-${step.status}`} data-testid={`step-indicator-${step.id}`}>
      <div className="step-badge">
        {step.status === 'complete' && <span className="icon-check">✓</span>}
        {step.status === 'failed' && <span className="icon-fail">✕</span>}
        {step.status === 'active' && <span className="spinner" data-testid="spinner" />}
        {step.status === 'pending' && <span className="step-num">{index + 1}</span>}
      </div>
      <div className="step-content">
        <div className="step-label">{step.label}</div>
        <div className="step-description">{step.description}</div>
      </div>
      {index < totalSteps - 1 && <div className="step-line" />}
    </div>
  );
};
