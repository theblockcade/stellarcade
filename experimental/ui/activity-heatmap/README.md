# Activity Heatmap Component

A GitHub-style 365-day activity heatmap calendar for visualizing player engagement over time.

## Features

- **52-week grid** of daily activity cells
- **5 intensity color levels** based on activity counts (0 = empty, 1-2 = low, 3-5 = medium, 6-9 = high, 10+ = ultra)
- **Interactive tooltips** showing exact date, activity count, and metadata
- **Month and day-of-week axis labels**
- **Responsive horizontal scrolling** on smaller viewports
- **Multiple color schemes**: green, neon, arcade
- **Keyboard accessible** with proper ARIA labels
- **Reduced motion support** for accessibility

## Installation

```bash
# Copy the component to your project
cp -r experimental/ui/activity-heatmap /path/to/your/components/
```

## Usage

```tsx
import { ActivityHeatmap } from './activity-heatmap/ActivityHeatmap';
import type { ActivityDataPoint } from './activity-heatmap/types';

const data: ActivityDataPoint[] = [
  { 
    date: '2026-01-01', 
    count: 5, 
    metadata: { 
      matchesPlayed: 3, 
      xpEarned: 150,
      questCheckIns: 2 
    } 
  },
  { 
    date: '2026-01-02', 
    count: 12, 
    metadata: { 
      matchesPlayed: 8, 
      xpEarned: 400 
    } 
  },
];

function App() {
  return (
    <ActivityHeatmap 
      data={data}
      colorScheme="green"
      startDate="2026-01-01"
      endDate="2026-12-31"
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `ActivityDataPoint[]` | `[]` | Array of activity data points |
| `startDate` | `string` | 365 days before end | Start date (ISO format) |
| `endDate` | `string` | Current date | End date (ISO format) |
| `colorScheme` | `'green' \| 'neon' \| 'arcade'` | `'green'` | Color scheme for intensity levels |
| `className` | `string` | `''` | Additional CSS classes |
| `testId` | `string` | `'activity-heatmap'` | Test ID for testing |

## ActivityDataPoint

```typescript
interface ActivityDataPoint {
  date: string;           // ISO date string (YYYY-MM-DD)
  count: number;          // Activity count for the day
  metadata?: {
    matchesPlayed?: number;
    xpEarned?: number;
    questCheckIns?: number;
    [key: string]: any;
  };
}
```

## Color Schemes

- **green**: Classic GitHub contribution graph colors
- **neon**: Cyberpunk-inspired dark theme colors
- **arcade**: Vibrant gaming-themed colors

## Intensity Levels

| Level | Count Range | Description |
|-------|-------------|-------------|
| 0 | 0 | No activity |
| 1 | 1-2 | Low activity |
| 2 | 3-5 | Medium activity |
| 3 | 6-9 | High activity |
| 4 | 10+ | Ultra activity |

## Accessibility

- Full keyboard navigation support
- ARIA labels for screen readers
- Reduced motion support for users who prefer it
- Focus indicators for keyboard users
- Semantic HTML structure

## Testing

```bash
# Run tests
npm test ActivityHeatmap.test.tsx
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers with touch support
- Requires CSS Grid and Flexbox support