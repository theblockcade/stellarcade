# @stellarcade/duel-challenge-popup

Experimental duel challenge popup UI widget for StellarCade.

## Components

- **`DuelChallengePopup`** — modal popup showing an incoming duel challenge with challenger info, game title, stake, countdown timer, and accept/decline actions

## Usage

```tsx
import { DuelChallengePopup } from "@stellarcade/duel-challenge-popup";

<DuelChallengePopup
  challenger={{ username: "StarFighter99", level: 14, winRate: 0.72 }}
  gameTitle="Coin Flip Showdown"
  stakeAmountXlm={25}
  expiresInSeconds={30}
  onAccept={handleAccept}
  onDecline={handleDecline}
  onClose={handleClose}
/>
```

## Testing

```bash
npm test
```
