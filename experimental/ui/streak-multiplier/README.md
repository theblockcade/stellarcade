# Streak Multiplier Dashboard Widget

An experimental React widget showing a player's current win/check-in streak, its payout multiplier, progress toward the next multiplier tier, and a countdown before the streak expires.

## Features

- **Streak Count & Multiplier**: Prominent display of the current streak length and its active payout multiplier (e.g. `1.50x`).
- **Tier Progress Bar**: Visual + numeric progress toward `nextTierAt`, capped at 100% once reached.
- **Expiration Countdown**: Live `HH:MM:SS` countdown to `expiresAt`, switching to warning styling once under 2 hours remain (configurable via `expirationWarningThresholdMs`).
- **Empty / New-User State**: A dedicated state for `currentStreak <= 0` with a "Start Streak" call to action instead of an empty progress bar.
- **Loading & Error Fallbacks**: `isLoading` renders a skeleton; `error` renders an alert with an optional `onRetry` action.
- **Check-In Guard**: The check-in button disables itself while the check-in call is in flight and again immediately after it resolves, until the parent supplies an updated `currentStreak` — preventing duplicate check-ins from a double click or a stale re-render.

## Usage

```tsx
import { StreakMultiplierWidget } from './streak-multiplier/StreakMultiplierWidget';

function StreakCard() {
  return (
    <StreakMultiplierWidget
      currentStreak={7}
      multiplier={1.5}
      nextTierAt={10}
      expiresAt="2026-08-28T00:00:00Z"
      onCheckIn={async () => {
        await api.checkIn();
      }}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentStreak` | `number` | required | Consecutive check-ins/wins in the current streak |
| `multiplier` | `number` | required | Active payout multiplier, e.g. `1.5` for 1.5x |
| `nextTierAt` | `number` | required | Streak count required to reach the next multiplier tier |
| `expiresAt` | `string \| number \| null` | required | ISO timestamp or epoch ms at which the streak expires; `null` hides the countdown |
| `onCheckIn` | `() => Promise<void> \| void` | `undefined` | Called when the player checks in; omit to render the widget read-only (no button) |
| `isLoading` | `boolean` | `false` | Renders the loading skeleton in place of streak content |
| `error` | `string \| null` | `null` | Renders the error fallback with this message |
| `onRetry` | `() => void` | `undefined` | Retry action surfaced in the error fallback |
| `expirationWarningThresholdMs` | `number` | `7200000` (2h) | Remaining-time threshold below which the countdown switches to warning styling |
| `className` | `string` | `''` | Additional CSS classes |
| `testId` | `string` | `'streak-multiplier-widget'` | Test ID for the root element |

## States

1. **Loading** (`isLoading`) — skeleton placeholder, no interactive elements.
2. **Error** (`error` set) — alert message plus optional retry button; takes priority over the empty state.
3. **Empty / New User** (`currentStreak <= 0`) — no streak yet, with a "Start Streak" check-in action.
4. **Active** — streak count, multiplier, tier progress bar, countdown (if `expiresAt` is set), and check-in button.

## Check-In Lifecycle

- Clicking **Check In** disables the button and shows "Checking in…" while `onCheckIn` resolves.
- On success, the button stays disabled and reads "Checked In" — this guards against a double-submit from clicking again before the parent's streak data refreshes.
- The lock releases automatically the next time the `currentStreak` prop actually changes (i.e. once the parent re-fetches and passes down the incremented streak), returning the button to its normal "Check In" state.

## Development & Testing

```bash
# Install dependencies
npm install

# Run unit test suite with Vitest
npm test
```

Tests cover: active-streak rendering (count, multiplier, progress bar/label), the zero-streak and negative-streak empty states, loading and error fallbacks, countdown parsing and formatting (including expired and unparseable inputs), warning-threshold styling (default and custom), and check-in button behavior — disabled while in flight, disabled immediately after success, and re-enabled once the streak prop updates.
