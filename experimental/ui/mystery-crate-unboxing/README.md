# mystery-crate-unboxing

Interactive daily-reward crate unboxing animation: idle shimmer prompt → opening (wobble + light rays) → opened (particle burst + reward summary card).

## Usage

```tsx
import { MysteryCrateUnboxing } from '@stellarcade/mystery-crate-unboxing';

<MysteryCrateUnboxing
  isOpen={showCrate}
  reward={reward} // undefined until the open request resolves
  onOpenCrate={async () => {
    const result = await api.openDailyCrate();
    setReward(result);
  }}
  onClaim={() => api.claimReward(reward.id)}
  onClose={() => setShowCrate(false)}
/>
```

## States

- **Idle** — shimmering crate with a "Tap to open!" prompt. Triggerable by click or keyboard (Enter/Space).
- **Opening** — wobble + light-ray animation while `onOpenCrate` resolves. The component transitions to `opened` automatically once the `reward` prop is populated.
- **Opened** — particle burst (rarity-tinted glow) plus a reward summary card showing the awarded XP/XLM amount or NFT badge name, with "Claim Reward" and "Open Another" actions.

## Props

| Prop | Type | Description |
|---|---|---|
| `isOpen` | `boolean` | Whether the overlay is shown. Reopening (`false` → `true`) resets the crate to idle. |
| `reward` | `UnboxedReward?` | The resolved reward. Providing it while `opening` triggers the transition to `opened`. |
| `onOpenCrate` | `() => Promise<void>` | Called once when the crate is triggered. Should resolve after fetching/settling the reward and passing it back via the `reward` prop. |
| `onClaim` | `() => void` | Called when "Claim Reward" is clicked. |
| `onClose` | `() => void` | Called when the close button is clicked. |

## Accessibility

The crate trigger has `role="button"`, `tabIndex={0}`, and an `aria-label`, and responds to both Enter and Space — not just click.

## Performance fallback

`CrateCanvas` accepts a `reducedEffects` prop that suppresses the particle-burst layer for low-performance devices, keeping only the CSS wobble/glow states.

## Development

```bash
npm install
npm test    # run vitest unit tests
```
