import React from 'react';
import './RelatedRecordActionRow.css';
import { SkeletonRow } from './LoadingSkeletonSet';

export interface RelatedRecordAction {
  label: string;
  icon?: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
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

  const isClickable = !!onClick;
  const MainComponent = isClickable ? 'button' : 'div';

  return (
    <div
      className={`related-record-action-row ${className}`.trim()}
      data-testid={testId}
    >
      <MainComponent
        className={`related-record-action-row__main ${isClickable ? 'related-record-action-row__main--clickable' : ''}`}
        onClick={isClickable ? onClick : undefined}
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

      {actions.length > 0 && (
        <div className="related-record-action-row__actions">
          {actions.map((action, index) => (
            <button
              key={`${id}-action-${index}`}
              type="button"
              className={`related-record-action-row__btn related-record-action-row__btn--${action.variant || 'secondary'}`}
              onClick={action.onClick}
              disabled={action.disabled}
              data-testid={action.testId || `${testId}-action-${index}`}
              aria-label={action.label}
              title={action.label}
            >
              {action.icon || action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default RelatedRecordActionRow;
