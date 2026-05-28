import React from 'react';
import './CompareChip.css';

export interface CompareChipProps {
  id: string;
  label: string;
  value?: string | number;
  isSelected?: boolean;
  isDisabled?: boolean;
  onSelect: (id: string, isSelected: boolean) => void;
  className?: string;
  testId?: string;
}

export const CompareChip: React.FC<CompareChipProps> = ({
  id,
  label,
  value,
  isSelected = false,
  isDisabled = false,
  onSelect,
  className = '',
  testId = 'compare-chip',
}) => {
  const baseClass = 'compare-chip';
  const classes = [
    baseClass,
    isSelected ? `${baseClass}--selected` : '',
    isDisabled ? `${baseClass}--disabled` : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={classes}
      disabled={isDisabled}
      aria-pressed={isSelected}
      onClick={() => {
        if (!isDisabled) {
          onSelect(id, !isSelected);
        }
      }}
      data-testid={testId}
    >
      <span className={`${baseClass}__label`}>{label}</span>
      {value !== undefined && <span className={`${baseClass}__value`}>{value}</span>}
    </button>
  );
};
