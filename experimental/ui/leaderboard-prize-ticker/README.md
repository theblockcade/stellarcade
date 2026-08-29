# Leaderboard Prize Ticker

Experimental daily leaderboard header showing the prize pool, settlement countdown, top-three prize split, and the current user's rank preview.

## Features

- Digital monospace countdown to the daily reset timestamp.
- Direct DOM clock updates every second so the whole component does not rerender for each tick.
- Red pulsing urgent state when the reset is less than 30 minutes away.
- Prize pool formatting with comma separators and two decimal places.
- Top-three prize chips for 1st, 2nd, and 3rd place distributions.
- Optional current user rank preview pill.

## Usage

```tsx
import { LeaderboardPrizeTicker } from './LeaderboardPrizeTicker';

export function LeaderboardHeader() {
  return (
    <LeaderboardPrizeTicker
      prizePoolXlm={1500}
      targetResetTs="2026-08-30T00:00:00.000Z"
      userRank={14}
      topPrizes={[50, 30, 20]}
    />
  );
}
```

## Props

| Prop | Type | Description |
| --- | --- | --- |
| `prizePoolXlm` | `number` | Total daily prize pool in XLM. |
| `targetResetTs` | `string` | ISO timestamp for the next daily settlement reset. |
| `userRank` | `number` | Optional current user leaderboard rank. |
| `topPrizes` | `number[]` | Percentage split for the top prizes, typically `[50, 30, 20]`. |
| `className` | `string` | Optional custom class name. |
| `testId` | `string` | Optional test id, defaults to `leaderboard-prize-ticker`. |

## Testing

The test file covers countdown formatting, prize pool rendering, rank pill rendering, prize distribution calculation, and interval-based clock updates.