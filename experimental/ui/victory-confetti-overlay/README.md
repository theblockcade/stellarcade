# VictoryConfettiOverlay

A victory celebration overlay component featuring customizable confetti bursts, prize odometer animation, and share shortcuts.

## Features
- Multi-colored CSS/Canvas confetti particle burst
- Animated rolling number odometer counting up to victory payout
- Action buttons for Play Again, Claim to Wallet, and social media sharing
- Keyboard accessible (ESC key to dismiss) and optional auto-dismiss timer

## Usage
```tsx
import { VictoryConfettiOverlay } from './VictoryConfettiOverlay';

<VictoryConfettiOverlay
  isOpen={showVictory}
  prizeAmount={500}
  currencySymbol="XLM"
  gameTitle="Stellar Slots"
  onPlayAgain={handlePlayAgain}
  onClose={() => setShowVictory(false)}
/>
```
