# Staking Calculator Widget

Interactive arcade token staking reward calculator with token amount input, lockup period selector (30d, 90d, 180d, 365d), estimated APY, and projected earnings breakdown.

## Usage

```tsx
<StakingCalculatorWidget
  userBalance={5000}
  apyRates={{ 30: 5, 90: 8, 180: 12, 365: 20 }}
  onProceedToStake={(amount, days) => console.log(`Stake ${amount} for ${days} days`)}
/>
```

## Props

| Prop | Type | Description |
|---|---|---|
| `userBalance` | `number` | User's available token balance for MAX button. |
| `apyRates` | `Record<number, number>` | APY percentages keyed by lock duration in days. |
| `onProceedToStake` | `(amount: number, days: number) => void` | Callback when "Stake Now" is clicked. |
| `className` | `string?` | Optional additional CSS class. |
| `testId` | `string?` | Optional data-testid override. |

## Features

- Preset amount buttons (100, 500, 1000, MAX)
- Duration selection chips with multiplier APY tags
- Dynamic daily, monthly, and maturity return projections
- Stake Now button pre-filling the staking workflow
- Dark theme consistent with StellarCade design system
- Respects `prefers-reduced-motion` for accessibility
