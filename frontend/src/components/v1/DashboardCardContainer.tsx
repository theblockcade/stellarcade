import React, { useId } from 'react';
import './DashboardCardContainer.css';

/**
 * DashboardCardContainer - Enhanced accessible card wrapper for dashboard items.
 *
 * Provides ARIA enhancements for complex dashboard cards:
 * - aria-label for card purpose
 * - aria-describedby for additional context
 * - aria-busy for loading states
 * - Proper semantic structure with headings
 *
 * Usage:
 * <DashboardCardContainer
 *   label="Account Balance"
 *   description="Current holdings and portfolio value"
 *   loading={isLoading}
 * >
 *   <div>{cardContent}</div>
 * </DashboardCardContainer>
 */

export interface DashboardCardContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Required accessible label for the card. */
  label: string;
  /** Optional description providing context for the card content. */
  description?: string;
  /** Visual variant for styling. */
  variant?: 'default' | 'primary' | 'elevated';
  /** Whether the card is in a loading state. */
  loading?: boolean;
  /** Optional label override when in loading state. */
  loadingLabel?: string;
  /** Whether the card is empty (no data to display). */
  isEmpty?: boolean;
  /** Custom element ID for aria-describedby targeting. */
  descriptionId?: string;
  /** Test ID for component testing. */
  testId?: string;
  children: React.ReactNode;
}

export const DashboardCardContainer: React.FC<DashboardCardContainerProps> = ({
  label,
  description,
  variant = 'default',
  loading = false,
  loadingLabel,
  isEmpty = false,
  descriptionId: customDescriptionId,
  testId = 'dashboard-card',
  className = '',
  children,
  ...rest
}) => {
  const generatedId = useId();
  const descriptionId = customDescriptionId || `${testId}-desc-${generatedId}`;
  const resolvedLabel = loading && loadingLabel ? loadingLabel : label;

  return (
    <div
      className={`dashboard-card dashboard-card--${variant} ${
        loading ? 'dashboard-card--loading' : ''
      } ${isEmpty ? 'dashboard-card--empty' : ''} ${className}`.trim()}
      data-testid={testId}
      role="region"
      aria-label={resolvedLabel}
      aria-describedby={description ? descriptionId : undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      {/* Hidden description for screen readers */}
      {description && (
        <span id={descriptionId} className="sr-only">
          {description}
        </span>
      )}

      {/* Card content */}
      <div className="dashboard-card__content" data-testid={`${testId}-content`}>
        {children}
      </div>

      {/* Optional loading overlay */}
      {loading && (
        <div
          className="dashboard-card__loading-overlay"
          aria-hidden="true"
          data-testid={`${testId}-loading`}
        >
          <div className="dashboard-card__spinner" />
        </div>
      )}

      {/* Optional empty state overlay */}
      {isEmpty && (
        <div
          className="dashboard-card__empty-overlay"
          data-testid={`${testId}-empty`}
        >
          <p className="dashboard-card__empty-text">No data available</p>
        </div>
      )}
    </div>
  );
};

DashboardCardContainer.displayName = 'DashboardCardContainer';
