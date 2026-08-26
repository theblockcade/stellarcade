export type CurrencyType = 'XLM' | 'ARCADE' | 'USD';

export interface CurrencyOption {
  type: CurrencyType;
  label: string;
  symbol: string;
  icon: string;
}

export interface CurrencySwitcherPillProps {
  xlmBalance: number;
  arcadeTokenBalance: number;
  xlmUsdRate: number;
  arcadeUsdRate?: number;
  selectedCurrency: CurrencyType;
  onCurrencyChange: (currency: CurrencyType) => void;
  onAddFunds?: () => void;
  isLoading?: boolean;
  className?: string;
  testId?: string;
}
