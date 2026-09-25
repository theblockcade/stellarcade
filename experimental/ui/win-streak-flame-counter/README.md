# Win Streak Flame Counter

An animated win-streak badge that shows escalating multiplier flames as players rack up
consecutive victories. Purely presentational — it never touches production dashboard state.

## Features

- **Progressive flame intensity tiers**:
  - `1-2` wins — Subtle spark (Amber)
  - `3-5` wins — Roaring flame (Crimson/Orange)
  - `6+` wins — Overdrive inferno (Violet/Cyan)
  - `0` wins — Dormant ember (calm reset state)
- **Animated SVG flame icon** that scales colour and particle intensity with the streak.
- **Spring-pop numeric counter** that animates on every increment (keyed re-mount).
- **Active multiplier badge** (e.g. `1.5x`, `2.0x`) beside the flame.
- **Accessible** — `role="img"` with an `aria-label` describing the streak and multiplier.
- **Fully self-contained** — no external dependencies, no coupling to core pages.

## Installation

```bash
cp -r experimental/ui/win-streak-flame-counter /path/to/your/components/
```

## Usage

```tsx
import { WinStreakFlameCounter } from './win-streak-flame-counter/WinStreakFlameCounter';

function LobbyHeader() {
  return (
    <WinStreakFlameCounter
      streakCount={4}
      multiplier={2}
      showMultiplier
      size="lg"
    />
  );
}
```

## Props

| Prop            | Type         | Default | Description                                    |
|-----------------|--------------|---------|------------------------------------------------|
| `streakCount`   | `number`     | required | Number of consecutive wins                    |
| `multiplier`    | `number`     | required | Active multiplier value                        |
| `showMultiplier`| `boolean`    | `true`  | Whether to render the multiplier badge         |
| `size`          | `'sm' \| 'md' \| 'lg'` | `'md'` | Size variant                          |
| `className`     | `string`     | `''`    | Extra class names                              |
| `testId`        | `string`     | `'win-streak-flame-counter'` | Root test id       |

## Flame tiers

| Streak | Tier       | Visual                                          |
|--------|------------|-------------------------------------------------|
| 0      | `dormant`  | Gray ember, no flicker, no particles            |
| 1-2    | `spark`    | Amber flame, gentle flicker, 2 particles        |
| 3-5    | `roar`     | Crimson/orange flame, stronger glow, 4 particles|
| 6+     | `inferno`  | Violet/cyan overdrive, double glow, 7 particles |

## Multiplier formatting

Multipliers are always rendered with one decimal place followed by `x`:

- `1.5` → `1.5x`
- `2` → `2.0x`
- `3.5` → `3.5x`

## Accessibility

- The badge exposes `role="img"` and a descriptive `aria-label`, e.g.
  `5 consecutive wins, 2.0x multiplier bonus`.
- Zero streaks announce `No active win streak. Streak dormant.`
- Animations respect `prefers-reduced-motion`.

## Testing

```bash
npx vitest run experimental/ui/win-streak-flame-counter/WinStreakFlameCounter.test.tsx
```

Covered scenarios:

- Zero streak renders the dormant state.
- A 5-streak renders roaring flame styling and the correct label.
- The multiplier badge renders a formatted multiplier string.
- Tier boundaries (1-2 spark, 3-5 roar, 6+ inferno).
- Size variants and `showMultiplier` toggling.