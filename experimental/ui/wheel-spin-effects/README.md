# wheel-spin-effects

Experimental particle burst + glow visualizer for spin-wheel style games.

## Usage

```tsx
import { WheelSpinEffects } from './WheelSpinEffects';

<WheelSpinEffects
  isSpinning={isSpinning}
  targetAngle={finalAngle}
  onSpinComplete={() => setIsSpinning(false)}
  particleIntensity="medium"
/>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `isSpinning` | `boolean` | — | Drives the phase transition: `idle` → `decelerating` → `complete`. |
| `targetAngle` | `number` | — | Final rotation angle (degrees) the glow ring eases toward. |
| `onSpinComplete` | `() => void` | — | Called once when the deceleration finishes. |
| `particleIntensity` | `'low' \| 'medium' \| 'high'` | `'medium'` | Number of particles spawned on completion (20/50/100). |

## Behavior

- Deceleration takes 2500ms and eases with a cubic-bezier ease-out curve applied to the glow ring's `transform`.
- A particle burst fires once, when the spin completes.
- Respects `prefers-reduced-motion: reduce` — deceleration becomes instant (0ms) and the CSS pulse animation is disabled.
- `spawnParticles` / `stepParticles` (from `ParticleCanvas.tsx`) are exported as pure functions for unit testing independent of `requestAnimationFrame`.

## Testing

```bash
npm install
npx vitest run
```
