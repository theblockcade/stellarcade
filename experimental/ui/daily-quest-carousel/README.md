# Daily Quest Carousel

An interactive, responsive horizontal carousel for displaying a player's active quests, with circular progress rings, animated claim buttons, and category filter tabs.

## Features

- **Horizontal Carousel**: Smooth scroll on mobile swipe and desktop arrow clicks, with scroll-snap alignment
- **Progress Rings**: Circular SVG progress indicator on each card (e.g. 3/5 matches played)
- **Animated Claim Button**: Pulses when a quest is complete and unclaimed; shows a loading state while claiming
- **Category Filters**: Pill-style tabs to switch between Daily, Weekly, and Milestone quests
- **Empty State**: Friendly message when all quests in the active category are complete
- **Accessibility**: `role="tablist"`/`aria-selected` on filters, `aria-busy` on the claim button, reduced-motion support

## Installation

```bash
# Copy the component to your project
cp -r experimental/ui/daily-quest-carousel /path/to/your/components/
```

## Usage

```tsx
import { DailyQuestCarousel } from './daily-quest-carousel/DailyQuestCarousel';
import type { QuestItem, QuestCategory } from './daily-quest-carousel/types';
import { useState } from 'react';

function QuestPanel() {
  const [filter, setFilter] = useState<QuestCategory>('daily');
  const [quests, setQuests] = useState<QuestItem[]>([
    {
      id: 'q1',
      title: 'Play 3 Matches',
      description: 'Complete 3 arcade matches today',
      category: 'daily',
      progress: 3,
      target: 3,
      reward: '500 XP',
      claimed: false,
    },
  ]);

  const handleClaim = async (questId: string) => {
    await api.claimQuest(questId);
    setQuests((prev) => prev.map((q) => (q.id === questId ? { ...q, claimed: true } : q)));
  };

  return (
    <DailyQuestCarousel
      quests={quests}
      activeFilter={filter}
      onFilterChange={setFilter}
      onClaim={handleClaim}
    />
  );
}
```

## Props

### `DailyQuestCarousel`

| Prop | Type | Description |
|------|------|-------------|
| `quests` | `QuestItem[]` | All quests; the component filters by `activeFilter` internally |
| `activeFilter` | `QuestCategory` | Currently selected category (`'daily' \| 'weekly' \| 'milestone'`) |
| `onFilterChange` | `(category: QuestCategory) => void` | Called when a filter pill is clicked |
| `onClaim` | `(questId: string) => Promise<void>` | Called when a completed quest's claim button is clicked |
| `className` | `string?` | Optional extra class name on the root element |
| `testId` | `string?` | Optional root `data-testid` override (default `daily-quest-carousel`) |

## Testing

```bash
# Run tests
npm test DailyQuestCarousel.test.tsx
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers with touch support
- Requires CSS Grid, Flexbox, and `scroll-snap` support

## Customization

You can customize the appearance by:

1. Adjusting the progress ring color and radius in `DailyQuestCarousel.css`
2. Changing the pulse animation duration/easing
3. Adjusting `SCROLL_STEP_PX` in `DailyQuestCarousel.tsx` for a different scroll distance per arrow click

## Performance

- **Memoized Filtering**: `useMemo` avoids re-filtering the quest list on unrelated re-renders
- **CSS Animations**: Hardware-accelerated transforms for the claim-button pulse
- **Reduced Motion**: Respects `prefers-reduced-motion` by disabling the pulse and ring transition
