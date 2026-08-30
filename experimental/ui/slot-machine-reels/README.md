# @stellarcade/slot-machine-reels

Experimental slot machine reels UI widget for StellarCade.

## Components

- **`SlotMachineReels`** — full slot machine with configurable reel count, spin state, win banner, jackpot display, and bet controls
- **`ReelColumn`** — individual reel that animates symbols while spinning and snaps to a landed symbol on stop

## Usage

```tsx
import { SlotMachineReels } from "@stellarcade/slot-machine-reels";

<SlotMachineReels
  reels={[symbols, symbols, symbols]}
  gameState="idle"
  betAmountXlm={10}
  jackpot={1000}
  onSpin={handleSpin}
  onBetChange={handleBetChange}
/>
```

## Testing

```bash
npm test
```
