# Player Level Badge

Experimental circular SVG player level badge: an animated XP progress arc,
center level-number badge with a tier-colored border, a tier icon (Bronze /
Silver / Gold / Diamond by level bracket), and an accessible tooltip showing
remaining XP to the next level. Pulses briefly when progress crosses 100%.

## Usage

```tsx
<PlayerLevelBadge
  currentXp={1450}
  xpForCurrentLevel={1000}
  xpForNextLevel={2000}
  level={14}
  size="md"
/>
```

## Props

| Prop | Type | Description |
|---|---|---|
| `currentXp` | `number` | Player's current total XP. |
| `xpForCurrentLevel` | `number` | XP threshold where the current level begins. |
| `xpForNextLevel` | `number` | XP threshold where the next level begins. |
| `level` | `number` | Current level number, also used for tier lookup. |
| `size` | `'sm' \| 'md' \| 'lg'?` | Badge diameter. Defaults to `'md'`. |

## Tier brackets

| Level range | Tier |
|---|---|
| 1–10 | Bronze |
| 11–25 | Silver |
| 26–50 | Gold |
| 51+ | Diamond |
