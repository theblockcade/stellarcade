/**
 * InlineEmptyStateSlot Component
 * 
 * A compact empty state component designed for inline use within cards and panels.
 * Unlike EmptyStateBlock which is for full-page states, this is optimized for
 * smaller containers like dashboard cards, sidebars, and panel sections.
 * 
 * @module components/v1/InlineEmptyStateSlot
 */

import React from 'react';
import './InlineEmptyStateSlot.css';

export interface InlineEmptyStateSlotAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  testId?: string;
}

export interface InlineEmptyStateSlotProps {
  /** Icon or emoji to display */
  icon?: React.ReactNode;
  /** Main message */
  message: string;
  /** Optional secondary description */
  description?: string;
  /** Optional action button */
  action?: InlineEmptyStateSlotAction;
  /** Size variant */
  size?: 'compact' | 'default';
  /** Optional CSS class */
  className?: string;
  /** Optional test ID */
  testId?: string;
}

/**
 * InlineEmptyStateSlot - Compact empty state for cards and panels.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <InlineEmptyStateSlot
 *   icon="📋"
 *   message="No items yet"
 * />
 * 
 * // With description and action
 * <InlineEmptyStateSlot
 *   icon="🎮"
 *   message="No games found"
 *   description="Try adjusting your filters"
 *   action={{
 *     label: 'Clear filters',
 *     onClick: handleClearFilters,
 *     variant: 'primary'
 *   }}
 * />
 * 
 * // Compact size for tight spaces
 * <InlineEmptyStateSlot
 *   icon="⚠️"
 *   message="No data available"
 *   size="compact"
 * />
 * ```
 */
export const InlineEmptyStateSlot: React.FC<InlineEmptyStateSlotProps> = ({
  icon,
  message,
  description,
  action,
  size = 'default',
  className = '',
  testId = 'inline-empty-state-slot',
}) => {
  const containerClasses = [
    'inline-empty-state-slot',
    `inline-empty-state-slot--${size}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={containerClasses}
      data-testid={testId}
      role="status"
      aria-live="polite"
    >
      {icon && (
        <div className="inline-empty-state-slot__icon" aria-hidden="true">
          {typeof icon === 'string' ? (
            <span className="inline-empty-state-slot__icon-text">{icon}</span>
          ) : (
            icon
          )}
        </div>
      )}
      
      <div className="inline-empty-state-slot__content">
        <p className="inline-empty-state-slot__message">{message}</p>
        
        {description && (
          <p className="inline-empty-state-slot__description">{description}</p>
        )}
        
        {action && (
          <button
            type="button"
            className={[
              'inline-empty-state-slot__action',
              `inline-empty-state-slot__action--${action.variant || 'secondary'}`,
            ].join(' ')}
            onClick={action.onClick}
            disabled={action.disabled}
            data-testid={action.testId || `${testId}-action`}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
};

InlineEmptyStateSlot.displayName = 'InlineEmptyStateSlot';

export default InlineEmptyStateSlot;
