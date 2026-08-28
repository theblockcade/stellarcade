# Match Wager Slider & Payout Estimator Card

An experimental React component for selecting a match wager amount and previewing the estimated fee, payout, and net profit in real time.

## Features

- **Slider + Numeric Input**: Drag the range slider or type an exact amount; both stay in sync.
- **Quick-Select Chips**: One-tap presets for `5`, `10`, `25`, `50`, and `MAX` (MAX resolves to the lower of the match's `maxWager` and the player's `availableBalance`).
- **Real-Time Payout Estimation**: Fee and payout recompute on every change, using a configurable `feeBasisPoints` platform fee.
- **Balance Validation Guard**: Shows an inline error and disables the slider/chips when the balance can't cover the minimum wager, and flags a typed amount that exceeds the available balance.
- **Multi-Token Toggle**: Optional XLM / ARCADE switcher (`multiToken` prop) for match types that accept more than one wager token.
- **Accessible**: Labeled input, `role="alert"` on validation errors, `aria-selected` on the token toggle, `aria-invalid` on the input when balance is exceeded.

## Usage

```tsx
import { MatchWagerCalculator } from './match-wager-calculator/MatchWagerCalculator';

function WagerStep() {
  return (
    <MatchWagerCalculator
      availableBalance={128.5}
      minWager={1}
      maxWager={500}
      feeBasisPoints={250}
      onWagerSelect={(wager, token) => console.log('selected', wager, token)}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `availableBalance` | `number` | required | Wallet balance available for wagering, in the currently selected token |
| `minWager` | `number` | required | Minimum wager amount allowed by the match rules |
| `maxWager` | `number` | required | Maximum wager amount allowed by the match rules (independent of balance) |
| `feeBasisPoints` | `number` | required | Platform fee in basis points (1/100th of a percent), e.g. `250` = 2.5% |
| `onWagerSelect` | `(wager: number, token: WagerToken) => void` | `undefined` | Called whenever the confirmed wager amount or token changes |
| `multiToken` | `boolean` | `true` | Enables the XLM / ARCADE token toggle |
| `initialToken` | `'XLM' \| 'ARCADE'` | `'XLM'` | Initial selected token when `multiToken` is enabled |
| `className` | `string` | `''` | Additional CSS classes |
| `testId` | `string` | `'match-wager-calculator'` | Test ID for the root element |

## Payout Model

The estimator uses a straightforward 2x-on-win model: a win returns the wager plus a matched amount from the opponent, with the platform fee deducted from the total payout.

```
grossPayout = wager * 2
feeAmount   = grossPayout * feeBasisPoints / 10000
payout      = max(0, grossPayout - feeAmount)
netProfit   = payout - wager
```

This is exported as `calculateWager(wager, feeBasisPoints)` for reuse outside the component (e.g. in a confirmation modal or server-side estimate).

## Validation Behavior

- If `availableBalance < minWager`, the slider and chips are disabled and an "insufficient balance" error is shown — there's no valid wager the player can place.
- If the player types an amount greater than `availableBalance` (but the balance itself is still >= `minWager`), an "exceeds balance" error is shown without forcibly clamping the input, so the player can see and correct the mismatch.
- Values are clamped to `[minWager, maxWager]` on blur / Enter for the numeric input, and the slider's native `min`/`max` enforce the same range while dragging.
- An empty or non-numeric typed value falls back to `minWager` on blur.

## Development & Testing

```bash
# Install dependencies
npm install

# Run unit test suite with Vitest
npm test
```

Tests cover: calculation accuracy (`calculateWager`, including zero-fee, 100%-fee, and negative/NaN wager edge cases), slider/chip/input synchronization, quick-select chip active-state tracking, MAX chip resolution against both balance-capped and rule-capped scenarios, balance validation (insufficient balance vs. exceeds balance), input clamping on blur, and the multi-token toggle.
