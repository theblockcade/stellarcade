/**
 * RecentItemsRail — Cross-surface recent items display component.
 *
 * Shows a horizontal scrollable rail of recently accessed items (games, transactions, etc.)
 * with consistent styling across dashboards and detail pages.
 */

import React, { useCallback, useMemo } from "react";
import "./RecentItemsRail.css";

export interface RecentItem {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  metadata?: Record<string, string>;
  accessedAt: number;
  href?: string;
}

export interface RecentItemsRailProps {
  /** Array of recent items to display */
  items: RecentItem[];
  /** Title for the rail section */
  title?: string;
  /** Callback when an item is clicked */
  onItemClick?: (item: RecentItem) => void;
  /** Maximum number of items to display (default: 8) */
  maxItems?: number;
  /** Whether to show empty state (default: true) */
  showEmpty?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Optional CSS class */
  className?: string;
  /** Optional test ID */
  testId?: string;
  /** Loading state */
  isLoading?: boolean;
}

const DEFAULT_MAX_ITEMS = 8;

export const RecentItemsRail: React.FC<RecentItemsRailProps> = ({
  items,
  title = "Recent Items",
  onItemClick,
  maxItems = DEFAULT_MAX_ITEMS,
  showEmpty = true,
  emptyMessage = "No recent items",
  className = "",
  testId = "recent-items-rail",
  isLoading = false,
}) => {
  const baseClass = "recent-items-rail";

  const displayItems = useMemo(() => {
    return items.sort((a, b) => b.accessedAt - a.accessedAt).slice(0, maxItems);
  }, [items, maxItems]);

  const handleItemClick = useCallback(
    (item: RecentItem) => {
      if (onItemClick) {
        onItemClick(item);
      } else if (item.href) {
        window.location.href = item.href;
      }
    },
    [onItemClick],
  );

  if (isLoading) {
    return (
      <div
        className={`${baseClass} ${className}`.trim()}
        data-testid={testId}
        role="region"
        aria-label={title}
      >
        {title && <h3 className={`${baseClass}__title`}>{title}</h3>}
        <div className={`${baseClass}__loading`}>
          <div className={`${baseClass}__skeleton`} />
          <div className={`${baseClass}__skeleton`} />
          <div className={`${baseClass}__skeleton`} />
        </div>
      </div>
    );
  }

  if (displayItems.length === 0 && showEmpty) {
    return (
      <div
        className={`${baseClass} ${className}`.trim()}
        data-testid={testId}
        role="region"
        aria-label={title}
      >
        {title && <h3 className={`${baseClass}__title`}>{title}</h3>}
        <div className={`${baseClass}__empty`}>
          <p className={`${baseClass}__empty-message`}>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  if (displayItems.length === 0) {
    return null;
  }

  return (
    <div
      className={`${baseClass} ${className}`.trim()}
      data-testid={testId}
      role="region"
      aria-label={title}
    >
      {title && <h3 className={`${baseClass}__title`}>{title}</h3>}
      <div className={`${baseClass}__scroll-container`}>
        <div className={`${baseClass}__items`}>
          {displayItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${baseClass}__item`}
              onClick={() => handleItemClick(item)}
              data-testid={`${testId}-item-${item.id}`}
              aria-label={`${item.title}${item.subtitle ? `: ${item.subtitle}` : ""}`}
            >
              {item.icon && (
                <div className={`${baseClass}__item-icon`}>{item.icon}</div>
              )}
              <div className={`${baseClass}__item-content`}>
                <p className={`${baseClass}__item-title`}>{item.title}</p>
                {item.subtitle && (
                  <p className={`${baseClass}__item-subtitle`}>
                    {item.subtitle}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecentItemsRail;
