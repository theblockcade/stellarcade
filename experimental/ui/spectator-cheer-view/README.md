# Spectator Cheer View

Experimental live match spectator mode layout with real-time turn updates, active wager pot display, cheer reaction buttons with floating particle animations, and viewer count.

## Usage

```tsx
<SpectatorCheerView
  match={{
    matchId: 'match-001',
    player1: 'Alice',
    player2: 'Bob',
    potAmount: 250.50,
    currentTurn: 'Alice',
    turnActions: [],
    elapsedSeconds: 125,
  }}
  viewerCount={42}
  onSendCheer={(type) => console.log('Cheer:', type)}
  onLeaveSpectator={() => console.log('Leaving')}
/>
```

## Props

| Prop | Type | Description |
|---|---|---|
| `match` | `LiveMatchData` | Current match state with players, pot, turns, and elapsed time. |
| `viewerCount` | `number` | Number of current spectators watching. |
| `onSendCheer` | `(cheerType: CheerType) => void` | Callback when a cheer button is clicked. |
| `onLeaveSpectator` | `() => void` | Callback when the leave button is clicked. |
| `className` | `string?` | Optional additional CSS class. |
| `testId` | `string?` | Optional data-testid override. |

## Cheer Types

| Type | Emoji | Description |
|---|---|---|
| `clap` | 👏 | Standard cheer |
| `fire` | 🔥 | Fire reaction |
| `diamond` | 💎 | Premium diamond cheer |

## Features

- Live viewer count badge with dynamic formatting (K/M suffixes)
- Active pot display with formatted currency
- Match timer in MM:SS format
- Real-time turn action timeline (shows last 5 actions)
- Three cheer buttons that spawn floating particle animations
- Floating particles auto-expire after 3 seconds
- Leave spectator mode button
- Dark theme consistent with StellarCade design system
- Respects `prefers-reduced-motion` for accessibility
