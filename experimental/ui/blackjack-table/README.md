# @stellarcade/blackjack-table

Experimental Blackjack table UI widget for StellarCade.

## Components

- **`BlackjackTable`** — full table layout with dealer/player hands, action buttons, outcome banner
- **`PlayingCard`** — animated card with face-up/face-down states and staggered deal animation

## Utilities

- `computeHandValue(hand)` — returns total hand value; Aces counted as 11 then reduced to 1 to avoid bust
- `formatHandValue(hand)` — returns display string; shows soft/hard for Ace hands (e.g. `"11 / 1"`)

## Usage

```tsx
import { BlackjackTable } from "@stellarcade/blackjack-table";

<BlackjackTable
  playerHand={playerCards}
  dealerHand={dealerCards}
  gameState="player_turn"
  betAmountXlm={50}
  onHit={handleHit}
  onStand={handleStand}
  onDoubleDown={handleDouble}
  onNewGame={handleNewGame}
/>
```

## Testing

```bash
npm test
```
