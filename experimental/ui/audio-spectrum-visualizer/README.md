# Audio Spectrum Visualizer

An arcade-themed audio spectrum visualizer for the experimental workspace. Renders animated
frequency bars with retro colour themes, peak-hold caps, and a play/pause simulation mode — no
changes to production audio settings.

## Features

- **Configurable frequency bands**: 8, 16 (default), or 32 bars.
- **Retro colour themes**: Cyberpunk Neon, Retro Green Phosphor, Sunset Synthwave.
- **Smooth falloff animation** with exponential decay toward the floor.
- **Peak-hold caps** that linger above each bar before decaying.
- **Play/Pause simulation mode** — the animation loop only runs while playing.
- **Mute handling** — flatlines all bars (and peaks) when muted.
- **Responsive container** that scales bars to the available width.
- **Accessible** — the decorative visualizer is `aria-hidden="true"` and a live text
  alternative announces mute/play/pause state.

## Installation

```bash
cp -r experimental/ui/audio-spectrum-visualizer /path/to/your/components/
```

## Usage

```tsx
import { AudioSpectrumVisualizer } from './audio-spectrum-visualizer/AudioSpectrumVisualizer';

function SettingsOverview({ isPlaying, isMuted }) {
  return (
    <AudioSpectrumVisualizer
      isPlaying={isPlaying}
      isMuted={isMuted}
      theme="phosphor"
      barCount={16}
      sensitivity={0.8}
    />
  );
}
```

## Props

| Prop          | Type                         | Default   | Description                                    |
|---------------|------------------------------|-----------|------------------------------------------------|
| `isPlaying`   | `boolean`                    | required  | Drives the animation loop                      |
| `isMuted`     | `boolean`                    | `false`   | Flatlines bars when true                       |
| `theme`       | `'neon' \| 'phosphor' \| 'synthwave'` | `'neon'`  | Colour theme                          |
| `barCount`    | `number`                     | `16`      | 8, 16, or 32 bars                             |
| `sensitivity` | `number`                     | `1`       | Impulse strength (clamped 0.1-1)              |
| `className`   | `string`                     | `''`      | Extra class names                              |
| `testId`      | `string`                     | `'audio-spectrum-visualizer'` | Root test id        |

## Themes

| Theme       | Class suffix      | Gradient                          |
|-------------|-------------------|-----------------------------------|
| `neon`      | `--theme-neon`    | Cyan → Fuchsia                    |
| `phosphor`  | `--theme-phosphor`| Green phosphor with glow          |
| `synthwave` | `--theme-synthwave`| Orange → Pink                    |

## Animation behaviour

- Bars are generated each frame as `decayed + impulse` clamped to `[0, 1]`.
- Peak caps hold the highest recent value and decay slowly.
- When `isPlaying` is `false` the `requestAnimationFrame` loop (with a `setTimeout`
  fallback) is cancelled and bars settle to zero.
- Unsupported `barCount` values fall back to 16.

## Accessibility

- The bar canvas is `aria-hidden="true"` (decorative).
- A visually-hidden live region (`role="status"`, `aria-live="polite"`) reports
  mute / active / paused state to screen readers.

## Testing

```bash
npx vitest run experimental/ui/audio-spectrum-visualizer/AudioSpectrumVisualizer.test.tsx
```

Covered scenarios:

- Renders the specified number of frequency bars.
- Muted state suppresses (flatlines) bar heights.
- Pause state halts the animation loop cleanly.
- Unsupported bar counts fall back to 16.
- `aria-hidden` + text alternative present.