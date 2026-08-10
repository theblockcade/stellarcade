import React from 'react';
import './FilterPillStrip.css';

export interface FilterPillOption {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

export interface FilterPillStripProps {
  options: FilterPillOption[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  allowMultiple?: boolean;
  showClearAll?: boolean;
  clearLabel?: string;
  className?: string;
  testId?: string;
}

export const FilterPillStrip: React.FC<FilterPillStripProps> = ({
  options = [],
  selectedIds = [],
  onChange,
  allowMultiple = true,
  showClearAll = true,
  clearLabel = 'Clear All',
  className = '',
  testId = 'filter-pill-strip',
}) => {
  const hasSelection = selectedIds.length > 0;

  const handlePillClick = (optionId: string, isDisabled?: boolean) => {
    if (isDisabled) return;

    if (allowMultiple) {
      if (selectedIds.includes(optionId)) {
        onChange(selectedIds.filter((id) => id !== optionId));
      } else {
        onChange([...selectedIds, optionId]);
      }
    } else {
      if (selectedIds.includes(optionId)) {
        onChange([]);
      } else {
        onChange([optionId]);
      }
    }
  };

  const handleClearAll = () => {
    onChange([]);
  };

  if (options.length === 0) return null;

  return (
    <div
      className={`filter-pill-strip-container ${className}`}
      data-testid={testId}
      role="group"
      aria-label="Filter options"
    >
      <div className="filter-pill-strip__scroll-wrapper">
        {options.map((option) => {
          const isSelected = selectedIds.includes(option.id);
          const ariaLabel = option.count !== undefined
            ? `${option.label}, ${option.count} items`
            : option.label;

          return (
            <button
              key={option.id}
              type="button"
              className={`filter-pill-strip__pill ${isSelected ? 'filter-pill-strip__pill--selected' : ''}`}
              onClick={() => handlePillClick(option.id, option.disabled)}
              disabled={option.disabled}
              aria-pressed={isSelected}
              aria-label={ariaLabel}
              data-testid={`${testId}-pill-${option.id}`}
            >
              <span className="filter-pill-strip__pill-label">{option.label}</span>
              {option.count !== undefined && (
                <span className="filter-pill-strip__pill-count" aria-hidden="true">
                  {option.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {showClearAll && hasSelection && (
        <button
          type="button"
          className="filter-pill-strip__clear-btn"
          onClick={handleClearAll}
          data-testid={`${testId}-clear-btn`}
          aria-label={clearLabel}
        >
          {clearLabel}
        </button>
      )}
    </div>
  );
};

FilterPillStrip.displayName = 'FilterPillStrip';
export default FilterPillStrip;
