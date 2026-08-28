# game-hud-overlay

Responsive in-game HUD overlay for live arcade matches: player score pills, wager amount, a match timer countdown circle, a mini emoji reaction tray, and a two-step surrender confirmation.

## Usage

```tsx
import { GameHudOverlay } from '@stellarcade/game-hud-overlay';

<GameHudOverlay
  p1={{ name: 'Alice', score: 3, isCurrentTurn: true }}
  p2={{ name: 'Bob', score: 1 }}
  secondsRemaining={12}
  wagerAmount={100}
  onSendReaction={(emoji) => sendReaction(emoji)}
  onSurrender={() => forfeitMatch()}
/>
```

## Props

| Prop | Type | Description |
|---|---|---|
| `p1` / `p2` | `PlayerHudData` | `{ name, score, isCurrentTurn? }` for each player. |
| `secondsRemaining` | `number` | Seconds left on the current turn/round timer. |
| `wagerAmount` | `number` | Wager amount, displayed formatted as XLM. |
| `onSendReaction` | `(emoji: ReactionEmoji) => void` | Called when a reaction button is clicked. |
| `onSurrender` | `() => void` | Called only after the surrender confirmation dialog is accepted. |

## Behavior

- The countdown circle (`TimerCountdownCircle`) turns red and pulses (`timer-countdown-circle--urgent`, `data-urgent="true"`) once `secondsRemaining` drops to 5 or below (and above 0).
- Clicking a reaction emoji fires `onSendReaction` immediately and shows a floating copy of the emoji that fades out ~1.2s later.
- Surrendering is a two-step action: the first click opens a confirmation dialog; `onSurrender` only fires if the player confirms. Cancelling dismisses the dialog with no side effects.
- Layout is responsive: the floating top-bar HUD (desktop) collapses toward stacked top/bottom bars on narrow viewports via CSS media queries (see the component's stylesheet in a consuming app).

## Development

```bash
npm install
npm test    # run vitest unit tests
```
