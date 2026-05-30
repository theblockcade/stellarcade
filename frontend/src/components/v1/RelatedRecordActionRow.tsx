import React from 'react';
import './RelatedRecordActionRow.css';
import { SkeletonRow } from './LoadingSkeletonSet';

export interface RelatedRecordAction {
  label: string;
  icon?: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  disabledReason?: string;
  isLoading?: boolean;
  testId?: string;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface RelatedRecordActionRowProps {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: RelatedRecordAction[];
  onClick?: () => void;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  disabled?: boolean;
  disabledReason?: string;
  className?: string;
  testId?: string;
}

export function RelatedRecordActionRow({
  id,
  title,
  subtitle,
  icon,
  actions = [],
  onClick,
  isLoading,
  isEmpty = false,
  emptyMessage = 'No records found',
  disabled = false,
  disabledReason,
  className = '',
  testId = 'related-record-action-row',
}: RelatedRecordActionRowProps): React.JSX.Element {
  if (isLoading) {
    return (
      <div className={`related-record-action-row related-record-action-row--loading ${className}`} data-testid={`${testId}-loading`}>
        <SkeletonRow />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div
        className={`related-record-action-row related-record-action-row--empty ${className}`.trim()}
        data-testid={`${testId}-empty`}
        role="status"
        aria-live="polite"
      >
        <div className="related-record-action-row__content">
          <div className="related-record-action-row__title related-record-action-row__title--empty">
            {emptyMessage}
          </div>
        </div>
      </div>
    );
  }

  const isClickable = !!onClick && !disabled;
  const MainComponent = isClickable ? 'button' : 'div';

  return (
    <div
      className={`related-record-action-row ${disabled ? 'related-record-action-row--disabled' : ''} ${className}`.trim()}
      data-testid={testId}
    >
      <MainComponent
        className={`related-record-action-row__main ${isClickable ? 'related-record-action-row__main--clickable' : ''}`}
        onClick={isClickable ? onClick : undefined}
        disabled={disabled}
        aria-disabled={disabled}
        aria-describedby={disabled && disabledReason ? `${testId}-disabled-reason` : undefined}
      >
        {icon && (
          <div className="related-record-action-row__icon">
            {icon}
          </div>
        )}
        
        <div className="related-record-action-row__content">
          <div className="related-record-action-row__title">{title}</div>
          {subtitle && <div className="related-record-action-row__subtitle">{subtitle}</div>}
        </div>
      </MainComponent>
      {disabled && disabledReason && (
        <span id={`${testId}-disabled-reason`} className="sr-only" role="status">
          {disabledReason}
        </span>
      )}

      {actions.length > 0 && (
        <div className="related-record-action-row__actions">
          {actions.map((action, index) => {
            const isActionDisabled = action.disabled || action.isLoading || disabled;
            return (
              <button
                key={`${id}-action-${index}`}
                type="button"
                className={`related-record-action-row__btn related-record-action-row__btn--${action.variant || 'secondary'}`}
                onClick={action.onClick}
                disabled={isActionDisabled}
                data-testid={action.testId || `${testId}-action-${index}`}
                aria-label={action.label}
                aria-busy={action.isLoading}
                aria-describedby={action.disabled && action.disabledReason ? `${testId}-action-${index}-reason` : undefined}
                title={action.label}
              >
                {action.isLoading ? (
                  <span className="related-record-action-row__spinner" aria-hidden="true" />
                ) : action.icon || action.label}
              </button>
            );
          })}
          {actions.map((action, index) => (
            action.disabled && action.disabledReason && (
              <span
                key={`${id}-action-${index}-reason`}
                id={`${testId}-action-${index}-reason`}
                className="sr-only"
                role="status"
              >
                {action.disabledReason}
              </span>
            )
          ))}
        </div>
      )}
    </div>
  );
}

export default RelatedRecordActionRow;
