import React, { useState, useRef, useEffect } from 'react';
import { CurrencyType, CurrencySwitcherPillProps, CurrencyOption } from './types';
import './CurrencySwitcherPill.css';

const CURRENCY_OPTIONS: CurrencyOption[] = [
  { type: 'XLM', label: 'Stellar XLM', symbol: 'XLM', icon: '🌌' },
  { type: 'ARCADE', label: 'Arcade Token', symbol: 'ARCADE', icon: '🕹️' },
  { type: 'USD', label: 'US Dollar', symbol: '$', icon: '💵' }
];

export const formatCurrencyBalance = (
  currency: CurrencyType,
  xlmBalance: number,
  arcadeBalance: number,
  xlmUsdRate: number,
  arcadeUsdRate: number = 0.05
): string => {
  switch (currency) {
    case 'XLM':
      return `${xlmBalance.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} XLM`;
    case 'ARCADE':
      return `${arcadeBalance.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} ARCADE`;
    case 'USD': {
      const xlmUsdValue = xlmBalance * xlmUsdRate;
      const arcadeUsdValue = arcadeBalance * arcadeUsdRate;
      const totalUsd = xlmUsdValue + arcadeUsdValue;
      return `$${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    default:
      return '0.00';
  }
};

export const CurrencySwitcherPill: React.FC<CurrencySwitcherPillProps> = ({
  xlmBalance,
  arcadeTokenBalance,
  xlmUsdRate,
  arcadeUsdRate = 0.05,
  selectedCurrency,
  onCurrencyChange,
  onAddFunds,
  isLoading = false,
  className = '',
  testId = 'currency-switcher-pill'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeOption = CURRENCY_OPTIONS.find((opt) => opt.type === selectedCurrency) || CURRENCY_OPTIONS[0];
  const formattedBalance = formatCurrencyBalance(
    selectedCurrency,
    xlmBalance,
    arcadeTokenBalance,
    xlmUsdRate,
    arcadeUsdRate
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (curr: CurrencyType) => {
    onCurrencyChange(curr);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`currency-switcher-pill ${className}`}
      data-testid={testId}
    >
      {isLoading ? (
        <div className="currency-switcher-pill__skeleton" data-testid="currency-skeleton">
          <div className="currency-switcher-pill__skeleton-badge" />
          <div className="currency-switcher-pill__skeleton-text" />
        </div>
      ) : (
        <div className="currency-switcher-pill__main">
          <button
            type="button"
            className="currency-switcher-pill__trigger"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-label={`Selected currency ${activeOption.label}. Click to switch currency.`}
            data-testid="currency-trigger"
          >
            <span className="currency-switcher-pill__icon" aria-hidden="true">
              {activeOption.icon}
            </span>
            <span className="currency-switcher-pill__badge">{activeOption.symbol}</span>
            <span className="currency-switcher-pill__balance" data-testid="currency-balance">
              {formattedBalance}
            </span>
            <span className="currency-switcher-pill__arrow" aria-hidden="true">
              {isOpen ? '▲' : '▼'}
            </span>
          </button>

          {onAddFunds && (
            <button
              type="button"
              className="currency-switcher-pill__add-btn"
              onClick={onAddFunds}
              title="Add Funds"
              aria-label="Add Funds"
              data-testid="add-funds-btn"
            >
              +
            </button>
          )}
        </div>
      )}

      {isOpen && !isLoading && (
        <ul className="currency-switcher-pill__dropdown" role="menu" data-testid="currency-dropdown">
          {CURRENCY_OPTIONS.map((option) => {
            const isSelected = option.type === selectedCurrency;
            const balancePreview = formatCurrencyBalance(
              option.type,
              xlmBalance,
              arcadeTokenBalance,
              xlmUsdRate,
              arcadeUsdRate
            );
            return (
              <li key={option.type} role="none">
                <button
                  type="button"
                  role="menuitem"
                  className={`currency-switcher-pill__option ${isSelected ? 'currency-switcher-pill__option--active' : ''}`}
                  onClick={() => handleSelect(option.type)}
                  data-currency-option={option.type}
                >
                  <span className="currency-switcher-pill__option-left">
                    <span className="currency-switcher-pill__option-icon">{option.icon}</span>
                    <span className="currency-switcher-pill__option-label">{option.label}</span>
                  </span>
                  <span className="currency-switcher-pill__option-val">{balancePreview}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
