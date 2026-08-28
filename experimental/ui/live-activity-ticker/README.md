# live-activity-ticker

Continuous horizontal marquee showing recent platform activity — wins, wagers, and jackpot events — as animated pills.

## Usage

```tsx
import { LiveActivityTicker } from "@stellarcade/live-activity-ticker";

<LiveActivityTicker
  events={[
    { id: "1", type: "win", gameIcon: "🪙", playerHandle: "@cryptoking", actionText: "won", amount: 25, asset: "XLM" },
    { id: "2", type: "jackpot", gameIcon: "🎰", playerHandle: "@whale99", actionText: "hit the jackpot", amount: 5000, asset: "XLM", isHighValue: true },
  ]}
  speed="normal"
  onSelectEvent={(event) => openEventDetails(event)}
/>
```

## Behavior

- The event list renders twice back-to-back so the CSS marquee (`translateX(-50%)`) loops seamlessly.
- Hovering over the ticker pauses the scroll (`live-activity-ticker-track--paused`); leaving resumes it.
- `isHighValue` events get a pulse animation (`activity-pill--pulse`) so jackpot wins stand out.
- Clicking a pill calls `onSelectEvent` with the pill's full event data.
- An empty `events` array renders a "No recent activity yet." fallback instead of an empty track.

## Props

| Prop | Type | Description |
|---|---|---|
| `events` | `TickerEvent[]` | Events to display, in order. |
| `speed` | `'slow' \| 'normal' \| 'fast'` | Marquee scroll speed. Defaults to `'normal'`. |
| `onSelectEvent` | `(event: TickerEvent) => void` | Called when a pill is clicked. |

## Development

```bash
npm install
npm test
```
