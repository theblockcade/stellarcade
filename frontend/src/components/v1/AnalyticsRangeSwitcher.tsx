/**
 * AnalyticsRangeSwitcher Component
 * 
 * A segmented control for switching between different time ranges in analytics views.
 * Provides a clean, accessible interface for filtering charts and summaries by time period.
 * 
 * @module components/v1/AnalyticsRangeSwitcher
 */

import React from 'react';
import './AnalyticsRangeSwitcher.css';

export interface TimeRange {
  id: string;
  label: string;
  shortLabel?: string;
  value: string;
  disabled?: boolean;
}

export interface AnalyticsRangeSwitcherProps {
  /** Available time ranges */
  ranges?: TimeRange[];
  /** Currently selected range ID */
  selectedId: string;
  /** Callback when range changes */
  onChange: (rangeId: string, range: TimeRange) => void;
  /** Size variant */
  size?: 'compact' | 'default';
  /** Additional CSS class */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Show labels on mobile */
  showLabelsOnMobile?: boolean;
}

const DEFAULT_RANGES: TimeRange[] = [
  { id: '24h', label: '24 Hours', shortLabel: '24H', value: '24h' },
  { id: '7d', label: '7 Days', shortLabel: '7D', value: '7d' },
  { id: '30d', label: '30 Days', shortLabel: '30D', value: '30d' },
  { id: '90d', label: '90 Days', shortLabel: '90D', value: '90d' },
  { id: '1y', label: '1 Year', shortLabel: '1Y', value: '1y' },
];

export const AnalyticsRangeSwitcher: React.FC<AnalyticsRangeSwitcherProps> = ({
  ranges = DEFAULT_RANGES,
  selectedId,
  onChange,
  size = 'default',
  className = '',
  testId = 'analytics-range-switcher',
  loading = false,
  disabled = false,
  showLabelsOnMobile = false,
}) => {
  const containerClasses = [
    'analytics-range-switcher',
    `analytics-range-switcher--${size}`,
    showLabelsOnMobile ? 'analytics-range-switcher--show-labels-mobile' : '',
    loading ? 'analytics-range-switcher--loading' : '',
    disabled ? 'analytics-range-switcher--disabled' : '',
    className,
  ].filter(Boolean).join(' ');

  const selectedRange = ranges.find(range => range.id === selectedId);

  const handleRangeChange = (range: TimeRange) => {
    if (disabled || loading || range.disabled) return;
    onChange(range.id, range);
  };

  const handleKeyDown = (event: React.KeyboardEvent, range: TimeRange) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleRangeChange(range);
    }
  };

  if (loading) {
    return (
      <div className={containerClasses} data-testid={`${testId}-loading`} role="status" aria-live="polite">
        <div className="analytics-range-switcher__loading">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="analytics-range-switcher__skeleton" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={containerClasses} 
      data-testid={testId}
      role="radiogroup"
      aria-label="Select time range for analytics"
    >
      <div className="analytics-range-switcher__track">
        {ranges.map((range) => {
          const isSelected = range.id === selectedId;
          const isDisabled = disabled || range.disabled;
          
          const buttonClasses = [
            'analytics-range-switcher__option',
            isSelected ? 'analytics-range-switcher__option--selected' : '',
            isDisabled ? 'analytics-range-switcher__option--disabled' : '',
          ].filter(Boolean).join(' ');

          return (
            <button
              key={range.id}
              type="button"
              className={buttonClasses}
              onClick={() => handleRangeChange(range)}
              onKeyDown={(e) => handleKeyDown(e, range)}
              disabled={isDisabled}
              aria-checked={isSelected}
              role="radio"
              data-testid={`${testId}-option-${range.id}`}
            >
              <span className="analytics-range-switcher__label analytics-range-switcher__label--full">
                {range.label}
              </span>
              {range.shortLabel && (
                <span className="analytics-range-switcher__label analytics-range-switcher__label--short">
                  {range.shortLabel}
                </span>
              )}
            </button>
          );
        })}
        
        {/* Selection indicator */}
        <div 
          className="analytics-range-switcher__indicator"
          style={{
            '--indicator-index': ranges.findIndex(r => r.id === selectedId),
            '--total-options': ranges.length,
          } as React.CSSProperties}
          aria-hidden="true"
        />
      </div>
      
      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {selectedRange ? `Selected time range: ${selectedRange.label}` : ''}
      </div>
    </div>
  );
};

AnalyticsRangeSwitcher.displayName = 'AnalyticsRangeSwitcher';

export default AnalyticsRangeSwitcher;