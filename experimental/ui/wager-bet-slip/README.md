# Wager Bet Slip

A collapsible slide-over bet slip drawer for queuing multiple wagers, adjusting
individual stakes, and placing single or parlay ("multi") bets in one batch
submission.

## Features

- Floating badge showing the current selection count (e.g. "3 Bets").
- Slide-over drawer with **Single** / **Multi** tabs.
- Per-selection stake input, odds display, and remove button.
- Aggregate summary: Total Stake, (Combined Odds in Multi mode), Estimated
  Payout, Potential Profit — all recomputed live as stakes/selections change.
- "Place All Bets" action that disables when the total stake exceeds the
  available balance or there are no selections, and shows a loading state
  while the submission promise is in flight.

## Usage

```tsx
import { WagerBetSlip } from "./WagerBetSlip";
import { BetSelection } from "./types";

const [selections, setSelections] = useState<BetSelection[]>([
  { id: "1", gameTitle: "Coinflip Streak", selectionLabel: "Heads", odds: 2, stake: 10 },
]);

<WagerBetSlip
  isOpen={isOpen}
  selections={selections}
  availableBalance={walletBalance}
  onUpdateStake={(id, stake) =>
    setSelections((prev) => prev.map((s) => (s.id === id ? { ...s, stake } : s)))
  }
  onRemove={(id) => setSelections((prev) => prev.filter((s) => s.id !== id))}
  onSubmitBets={async () => {
    await placeBetsOnChain(selections);
  }}
  onClose={() => setIsOpen(false)}
/>
```

## Odds math

- **Single mode**: each selection settles independently — the estimated
  payout is the sum of `stake * odds` across all selections.
- **Multi mode (parlay)**: all selections must win together. The combined
  odds multiplier is the product of every selection's odds, applied to the
  total staked across all legs (`totalStake * combinedOdds`).

## Testing

```bash
npm install
npm test
```
