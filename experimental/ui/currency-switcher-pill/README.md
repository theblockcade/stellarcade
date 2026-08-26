# Experimental Dual-Currency Balance Switcher Pill Component

A compact header React component for StellarCade that allows users to toggle balance displays between native XLM, custom ARCADE game tokens, and total USD fiat valuation with animated transitions, skeleton loading state, and funds shortcut.

## Features

- **Segmented Pill Design**: Compact UI widget displaying active currency symbol, icon badge, and formatted balance.
- **Valuation Precision**: Automatically formats crypto balances with 4 decimal places and fiat USD values with 2 decimal places.
- **Combined Fiat Valuation**: Calculates live USD valuation using configurable exchange rate props (`xlmUsdRate`, `arcadeUsdRate`).
- **Quick Add Shortcut**: Integrated `+` button shortcut to trigger wallet deposit / add funds modal callbacks (`onAddFunds`).
- **Skeleton State**: Graceful loading skeleton state (`isLoading`) during balance refreshes or wallet synchronizations.
- **Outside Click Dismissal**: Accessible dropdown selector that automatically closes on outside click.

## Usage

```tsx
import React, { useState } from 'react';
import { CurrencySwitcherPill, CurrencyType } from './CurrencySwitcherPill';

export const HeaderBar = () => {
  const [currency, setCurrency] = useState<CurrencyType>('XLM');

  return (
    <CurrencySwitcherPill
      xlmBalance={1250.5}
      arcadeTokenBalance={5000}
      xlmUsdRate={0.12}
      arcadeUsdRate={0.05}
      selectedCurrency={currency}
      onCurrencyChange={(newCurr) => setCurrency(newCurr)}
      onAddFunds={() => console.log('Open deposit modal')}
    />
  );
};
```

## Props

| Prop | Type | Description |
|---|---|---|
| `xlmBalance` | `number` | User's native XLM balance |
| `arcadeTokenBalance` | `number` | User's custom ARCADE token balance |
| `xlmUsdRate` | `number` | Exchange rate (USD per XLM) |
| `arcadeUsdRate` | `number?` | Exchange rate (USD per ARCADE), default: `0.05` |
| `selectedCurrency` | `'XLM' \| 'ARCADE' \| 'USD'` | Currently active display currency |
| `onCurrencyChange` | `(currency: CurrencyType) => void` | Selection callback |
| `onAddFunds` | `() => void` | Optional deposit button callback |
| `isLoading` | `boolean?` | Displays skeleton loading state |
| `className` | `string?` | Optional container CSS class override |
| `testId` | `string?` | Test ID for DOM queries |

## Testing

Run unit tests with Vitest:

```bash
npx vitest run experimental/ui/currency-switcher-pill/CurrencySwitcherPill.test.tsx
```
