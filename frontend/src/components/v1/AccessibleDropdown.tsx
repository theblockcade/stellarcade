import React, { useState, useRef, useEffect } from 'react';
import './AccessibleDropdown.css';

export interface DropdownOption {
  value: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface AccessibleDropdownProps {
  options: DropdownOption[];
  selectedValue?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: 'default' | 'compact';
  className?: string;
  testId?: string;
  ariaLabel?: string;
}

export const AccessibleDropdown: React.FC<AccessibleDropdownProps> = ({
  options = [],
  selectedValue,
  onChange,
  placeholder = 'Select option...',
  disabled = false,
  size = 'default',
  className = '',
  testId = 'accessible-dropdown',
  ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionsRef = useRef<(HTMLDivElement | null)[]>([]);

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Update highlighted index when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex((opt) => opt.value === selectedValue);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    } else {
      setHighlightedIndex(-1);
    }
  }, [isOpen, selectedValue, options]);

  // Scroll active option into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0) {
      optionsRef.current[highlightedIndex]?.scrollIntoView({
        block: 'nearest',
      });
    }
  }, [highlightedIndex, isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  const handleSelect = (value: string, isOptDisabled?: boolean) => {
    if (isOptDisabled) return;
    onChange(value);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else if (highlightedIndex >= 0) {
          handleSelect(options[highlightedIndex].value, options[highlightedIndex].disabled);
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) => {
            let next = prev + 1;
            while (next < options.length && options[next].disabled) {
              next++;
            }
            return next < options.length ? next : prev;
          });
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex((prev) => {
            let next = prev - 1;
            while (next >= 0 && options[next].disabled) {
              next--;
            }
            return next >= 0 ? next : prev;
          });
        }
        break;

      case 'Escape':
      case 'Tab':
        if (isOpen) {
          e.preventDefault();
          setIsOpen(false);
          triggerRef.current?.focus();
        }
        break;

      case 'Home':
        e.preventDefault();
        if (isOpen) {
          let first = 0;
          while (first < options.length && options[first].disabled) {
            first++;
          }
          if (first < options.length) setHighlightedIndex(first);
        }
        break;

      case 'End':
        e.preventDefault();
        if (isOpen) {
          let last = options.length - 1;
          while (last >= 0 && options[last].disabled) {
            last--;
          }
          if (last >= 0) setHighlightedIndex(last);
        }
        break;

      default:
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`accessible-dropdown-container accessible-dropdown-container--${size} ${className}`}
      data-testid={testId}
    >
      <button
        ref={triggerRef}
        type="button"
        className={`accessible-dropdown__trigger ${isOpen ? 'accessible-dropdown__trigger--open' : ''}`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        data-testid={`${testId}-trigger`}
      >
        <span className="accessible-dropdown__trigger-content">
          {selectedOption?.icon && (
            <span className="accessible-dropdown__trigger-icon" aria-hidden="true">
              {selectedOption.icon}
            </span>
          )}
          <span className="accessible-dropdown__trigger-label">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        <span className="accessible-dropdown__chevron" aria-hidden="true">
          ▼
        </span>
      </button>

      {isOpen && (
        <div
          className="accessible-dropdown__listbox"
          role="listbox"
          aria-label={ariaLabel || 'Options list'}
          data-testid={`${testId}-listbox`}
        >
          {options.map((option, idx) => {
            const isSelected = option.value === selectedValue;
            const isHighlighted = idx === highlightedIndex;

            return (
              <div
                key={option.value}
                ref={(el) => (optionsRef.current[idx] = el)}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled}
                className={`accessible-dropdown__option ${
                  isSelected ? 'accessible-dropdown__option--selected' : ''
                } ${isHighlighted ? 'accessible-dropdown__option--highlighted' : ''} ${
                  option.disabled ? 'accessible-dropdown__option--disabled' : ''
                }`}
                onClick={() => handleSelect(option.value, option.disabled)}
                onMouseEnter={() => !option.disabled && setHighlightedIndex(idx)}
                data-testid={`${testId}-option-${option.value}`}
              >
                {option.icon && (
                  <span className="accessible-dropdown__option-icon" aria-hidden="true">
                    {option.icon}
                  </span>
                )}
                <span className="accessible-dropdown__option-label">{option.label}</span>
                {option.count !== undefined && (
                  <span className="accessible-dropdown__option-count">{option.count}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

AccessibleDropdown.displayName = 'AccessibleDropdown';
export default AccessibleDropdown;
