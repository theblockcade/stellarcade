import React from 'react';
import './GuidedActionFooter.css';
import { StickyActionsFooter } from './StickyActionsFooter';

export interface GuidedAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  testId?: string;
}

export interface GuidedActionFooterProps {
  primaryAction: GuidedAction;
  secondaryAction?: GuidedAction;
  tertiaryAction?: GuidedAction;
  steps?: Array<{ id: string; label: string }>;
  currentStepId?: string;
  className?: string;
  testId?: string;
}

export function GuidedActionFooter({
  primaryAction,
  secondaryAction,
  tertiaryAction,
  steps,
  currentStepId,
  className = '',
  testId = 'guided-action-footer',
}: GuidedActionFooterProps): React.JSX.Element {
  return (
    <StickyActionsFooter 
      className={`guided-action-footer ${className}`.trim()}
      testId={testId}
      steps={steps}
      currentStepId={currentStepId}
    >
      <div className="guided-action-footer__layout">
        <div className="guided-action-footer__left">
          {tertiaryAction && (
            <button
              type="button"
              className="guided-action-footer__btn guided-action-footer__btn--tertiary"
              onClick={tertiaryAction.onClick}
              disabled={tertiaryAction.disabled || tertiaryAction.isLoading}
              data-testid={tertiaryAction.testId ?? `${testId}-tertiary-btn`}
            >
              {tertiaryAction.label}
            </button>
          )}
        </div>

        <div className="guided-action-footer__right">
          {secondaryAction && (
            <button
              type="button"
              className="guided-action-footer__btn guided-action-footer__btn--secondary"
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.disabled || secondaryAction.isLoading}
              data-testid={secondaryAction.testId ?? `${testId}-secondary-btn`}
            >
              {secondaryAction.label}
            </button>
          )}
          
          <button
            type="button"
            className={`guided-action-footer__btn guided-action-footer__btn--primary ${
              primaryAction.isLoading ? 'guided-action-footer__btn--loading' : ''
            }`}
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled || primaryAction.isLoading}
            data-testid={primaryAction.testId ?? `${testId}-primary-btn`}
          >
            {primaryAction.isLoading ? (
              <span className="guided-action-footer__spinner" aria-hidden="true" />
            ) : null}
            <span className="guided-action-footer__btn-content">{primaryAction.label}</span>
          </button>
        </div>
      </div>
    </StickyActionsFooter>
  );
}

export default GuidedActionFooter;
