import React from 'react';
import './GuidedActionFooter.css';
import { StickyActionsFooter } from './StickyActionsFooter';

export interface GuidedAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  testId?: string;
  disabledReason?: string;
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
              aria-busy={tertiaryAction.isLoading}
              aria-describedby={tertiaryAction.disabled && tertiaryAction.disabledReason ? `${testId}-tertiary-reason` : undefined}
            >
              {tertiaryAction.label}
            </button>
          )}
          {tertiaryAction?.disabled && tertiaryAction.disabledReason && (
            <span id={`${testId}-tertiary-reason`} className="sr-only" role="status">
              {tertiaryAction.disabledReason}
            </span>
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
              aria-busy={secondaryAction.isLoading}
              aria-describedby={secondaryAction.disabled && secondaryAction.disabledReason ? `${testId}-secondary-reason` : undefined}
            >
              {secondaryAction.label}
            </button>
          )}
          {secondaryAction?.disabled && secondaryAction.disabledReason && (
            <span id={`${testId}-secondary-reason`} className="sr-only" role="status">
              {secondaryAction.disabledReason}
            </span>
          )}
          
          <button
            type="button"
            className={`guided-action-footer__btn guided-action-footer__btn--primary ${
              primaryAction.isLoading ? 'guided-action-footer__btn--loading' : ''
            }`}
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled || primaryAction.isLoading}
            data-testid={primaryAction.testId ?? `${testId}-primary-btn`}
            aria-busy={primaryAction.isLoading}
            aria-describedby={primaryAction.disabled && primaryAction.disabledReason ? `${testId}-primary-reason` : undefined}
          >
            {primaryAction.isLoading ? (
              <span className="guided-action-footer__spinner" aria-hidden="true" />
            ) : null}
            <span className="guided-action-footer__btn-content">{primaryAction.label}</span>
          </button>
          {primaryAction.disabled && primaryAction.disabledReason && (
            <span id={`${testId}-primary-reason`} className="sr-only" role="status">
              {primaryAction.disabledReason}
            </span>
          )}
        </div>
      </div>
    </StickyActionsFooter>
  );
}

export default GuidedActionFooter;
