# Leaderboard Rank Delta Badge

A lightweight ranking delta indicator component displaying rank climbs, drops, and stability with a hoverable mini history sparkline tooltip.

## Features

- **Directional Indicators**: Green arrow up (+N) for rank climbs, Red arrow down (-N) for drops, or neutral dash (−) for no change
- **Special Styling**: Glowing effect for "New Entry" or "Top 3" ranks
- **Interactive Tooltip**: Mini 7-day rank history chart or summary text on hover/focus
- **Accessibility**: ARIA labels announcing rank change descriptions
- **Responsive Design**: Works on desktop hover and mobile tap
- **Reduced Motion**: Respects prefers-reduced-motion preference
- **Multiple Sizes**: Small, medium, and large variants

## Installation

```bash
# Copy the component to your project
cp -r experimental/ui/leaderboard-rank-delta /path/to/your/components/
```

## Usage

```tsx
import { LeaderboardRankDelta } from './leaderboard-rank-delta/LeaderboardRankDelta';
import type { RankHistoryPoint } from './leaderboard-rank-delta/types';

function Leaderboard() {
  const history: RankHistoryPoint[] = [
    { date: '2026-08-17', rank: 10 },
    { date: '2026-08-18', rank: 8 },
    { date: '2026-08-19', rank: 6 },
    { date: '2026-08-20', rank: 5 },
    { date: '2026-08-21', rank: 4 },
    { date: '2026-08-22', rank: 3 },
    { date: '2026-08-23', rank: 2 },
  ];

  return (
    <div className="leaderboard-row">
      <span>Player Name</span>
      <LeaderboardRankDelta
        currentRank={2}
        previousRank={5}
        history={history}
        size="md"
      />
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentRank` | `number` | required | Current rank position |
| `previousRank` | `number \| null` | required | Previous rank position (null for new entries) |
| `history` | `RankHistoryPoint[]` | `[]` | Historical rank data for tooltip |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size variant |
| `className` | `string` | `''` | Additional CSS classes |
| `testId` | `string` | `'leaderboard-rank-delta'` | Test ID for testing |

## RankHistoryPoint

```typescript
interface RankHistoryPoint {
  date: string;    // ISO date string (YYYY-MM-DD)
  rank: number;    // Rank position on that date
}
```

## Visual Indicators

### Rank Changes

- **↑ +N**: Green upward arrow with positive number (rank improved)
- **↓ -N**: Red downward arrow with negative number (rank declined)
- **−**: Gray dash (no change)

### Special States

- **NEW**: Blue "NEW" badge for first-time leaderboard entries
- **Top 3**: Golden glowing effect for ranks 1-3

## Size Variants

- **sm**: 10px font size, compact padding
- **md**: 12px font size, medium padding (default)
- **lg**: 14px font size, larger padding

## Tooltip

When history data is provided, hovering over the badge displays a tooltip with:

- **7-Day History**: Title showing the time range
- **Best Rank**: Highest position achieved in the period
- **Current Rank**: Current position
- **Average Rank**: Mean rank over the period
- **Mini Chart**: Visual bar chart showing rank progression

## Accessibility

- **ARIA Labels**: Screen reader announcements of rank changes
- **Keyboard Navigation**: Full keyboard support with tab and focus
- **Focus Management**: Tooltip shows on focus, hides on blur
- **Reduced Motion**: Animations disabled for users who prefer it
- **Semantic HTML**: Proper button role and interactive states

### ARIA Label Examples

- Positive change: "Rank increased by 3 positions to 5"
- Negative change: "Rank decreased by 2 positions to 10"
- No change: "Rank unchanged at 5"
- New entry: "New entry at rank 3"

## Examples

### Basic Usage

```tsx
<LeaderboardRankDelta
  currentRank={5}
  previousRank={8}
/>
```

### New Entry

```tsx
<LeaderboardRankDelta
  currentRank={3}
  previousRank={null}
/>
```

### With History Tooltip

```tsx
<LeaderboardRankDelta
  currentRank={2}
  previousRank={5}
  history={[
    { date: '2026-08-17', rank: 10 },
    { date: '2026-08-18', rank: 8 },
    { date: '2026-08-19', rank: 6 },
  ]}
/>
```

### Size Variants

```tsx
<LeaderboardRankDelta
  currentRank={5}
  previousRank={8}
  size="sm"
/>

<LeaderboardRankDelta
  currentRank={5}
  previousRank={8}
  size="lg"
/>
```

## Testing

```bash
# Run tests
npm test LeaderboardRankDelta.test.tsx
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers with touch support
- Requires CSS Grid and Flexbox support

## Customization

You can customize the appearance by:

1. Modifying CSS variables in `LeaderboardRankDelta.css`
2. Adjusting color values for different states
3. Changing animation timing and effects
4. Customizing tooltip layout and chart styling

## Performance

- **Optimized Re-renders**: Uses React.memo for efficient updates
- **CSS Animations**: Hardware-accelerated transforms for smooth effects
- **Minimal JavaScript**: Tooltip calculations are lightweight
- **Reduced Motion**: Respects user preferences for accessibility