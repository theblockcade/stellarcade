# trophy-showcase-grid

Responsive achievement trophy grid with rarity tiers, unlock-status filter tabs, and locked-trophy progress bars.

## Usage

```tsx
import { TrophyShowcaseGrid } from "@stellarcade/trophy-showcase-grid";

<TrophyShowcaseGrid
  trophies={[
    { id: "1", title: "First Blood", description: "...", rarity: "bronze", status: "unlocked", unlockDate: "2026-01-01", rewardXp: 100 },
    { id: "2", title: "Streak Master", description: "...", rarity: "gold", status: "in_progress", rewardXp: 500, progress: { current: 7, target: 10 } },
  ]}
  columns={4}
  onSelectTrophy={(trophy) => openTrophyDetails(trophy)}
/>
```

## Behavior

- Filter tabs (All / Unlocked / In Progress / Locked) instantly narrow the visible grid — no re-fetch, pure client-side filtering.
- Locked trophies render with a `trophy-card--grayscale` class.
- In-progress trophies show a progress bar and `current/target` label (e.g. "7/10").
- Clicking a card calls `onSelectTrophy` with the trophy's full data, for a details modal/popover to consume.
- `columns` controls the grid's column count (3, 4, or 5) via a `trophy-showcase-grid--cols-N` class.

## Props

| Prop | Type | Description |
|---|---|---|
| `trophies` | `TrophyItem[]` | All trophies (unfiltered — filtering happens internally). |
| `onSelectTrophy` | `(trophy: TrophyItem) => void` | Called when a card is clicked. |
| `columns` | `3 \| 4 \| 5` | Grid column count. Defaults to `4`. |

## Development

```bash
npm install
npm test
```
