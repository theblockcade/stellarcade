"use client";

import React from "react";
import "./NoResultsStateShell.css";

export interface NoResultsActiveFilter {
  id: string;
  label: string;
  value?: string;
  locked?: boolean;
}

export interface NoResultsStateShellProps {
  title?: string;
  description?: string;
  filters?: NoResultsActiveFilter[];
  onClearFilter?: (id: string) => void;
  onClearAll?: () => void;
  clearAllLabel?: string;
  secondaryAction?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  testId?: string;
}

const DEFAULT_TITLE = "No matches found";
const DEFAULT_DESCRIPTION =
  "Adjust your filters or clear them to see the rest of the feed.";

export const NoResultsStateShell: React.FC<NoResultsStateShellProps> = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  filters,
  onClearFilter,
  onClearAll,
  clearAllLabel = "Clear all filters",
  secondaryAction,
  disabled = false,
  className,
  testId = "no-results-state-shell",
}) => {
  const activeFilters = filters ?? [];
  const dismissibleFilters = activeFilters.filter((f) => !f.locked);
  const canClearAll =
    !disabled && dismissibleFilters.length > 0 && typeof onClearAll === "function";

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid={testId}
      className={"no-results-shell" + (className ? ` ${className}` : "")}
    >
      <div className="no-results-shell__body">
        <p className="no-results-shell__title">{title}</p>
        {description && (
          <p className="no-results-shell__description">{description}</p>
        )}
        {activeFilters.length > 0 && (
          <ul
            className="no-results-shell__filters"
            aria-label="Active filters"
            data-testid={`${testId}-filters`}
          >
            {activeFilters.map((filter) => (
              <li
                key={filter.id}
                className="no-results-shell__filter-chip"
                data-testid={`${testId}-filter-${filter.id}`}
              >
                <span className="no-results-shell__filter-label">
                  {filter.label}
                </span>
                {filter.value !== undefined && (
                  <span className="no-results-shell__filter-value">
                    {filter.value}
                  </span>
                )}
                {!filter.locked && onClearFilter && (
                  <button
                    type="button"
                    className="no-results-shell__filter-clear"
                    onClick={() => onClearFilter(filter.id)}
                    aria-label={`Clear filter: ${filter.label}`}
                    data-testid={`${testId}-clear-${filter.id}`}
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="no-results-shell__actions">
          {canClearAll && (
            <button
              type="button"
              className="no-results-shell__action no-results-shell__action--primary"
              onClick={onClearAll}
              data-testid={`${testId}-clear-all`}
            >
              {clearAllLabel}
            </button>
          )}
          {secondaryAction && (
            <div className="no-results-shell__secondary">
              {secondaryAction}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

NoResultsStateShell.displayName = "NoResultsStateShell";
export default NoResultsStateShell;
