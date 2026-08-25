# Sound & Haptics Feedback Controller

An experimental React Context provider + hook that synthesizes short Web Audio
tones and triggers Vibration API haptic patterns for live match events (match
start, countdowns, wins, losses, wagers, button clicks), with a settings panel
and full user preference persistence.

## Features

- **Synthesized Audio Cues**: Oscillator-based tones for `click`, `countdown`, `win`, `loss`, `wager_placed` — no audio files required
- **Haptic Patterns**: `tap`, `double_buzz`, `success_rumble` vibration patterns for supported mobile devices, auto-mapped to sound cues
- **Settings Panel**: Master volume slider, independent SFX/Music mute toggles, haptics on/off toggle
- **Persistence**: Settings persist to `localStorage` and reinitialize on load
- **Graceful Degradation**: Feature-detects `AudioContext`/`webkitAudioContext` and `navigator.vibrate`; never throws when either (or both) are unavailable, and never throws if a browser blocks/ignores a call
- **Gesture-Aware**: Attempts to resume a suspended `AudioContext` (required by most browsers before a user gesture) without ever throwing if resume fails

## Installation

```bash
cp -r experimental/ui/sound-haptics-controller /path/to/your/components/
```

## Usage

Wrap your app (or arcade/game shell) once with the provider:

```tsx
import { SoundHapticsProvider } from './sound-haptics-controller/SoundHapticsProvider';

function App({ children }) {
  return <SoundHapticsProvider>{children}</SoundHapticsProvider>;
}
```

Then consume feedback from any descendant:

```tsx
import { useSoundFeedback } from './sound-haptics-controller/useSoundFeedback';

function WagerButton() {
  const { playSound, triggerHaptic } = useSoundFeedback();

  const handleClick = () => {
    playSound('wager_placed');
    triggerHaptic('tap');
  };

  return <button onClick={handleClick}>Place Wager</button>;
}
```

Play a sound and its default companion haptic together:

```tsx
import { playSoundWithHaptic } from './sound-haptics-controller/SoundHapticsProvider';
import { useSoundFeedback } from './sound-haptics-controller/useSoundFeedback';

function WinBanner() {
  const { playSound, triggerHaptic } = useSoundFeedback();

  useEffect(() => {
    playSoundWithHaptic(playSound, triggerHaptic, 'win');
  }, []);

  return <div>You win!</div>;
}
```

Render the settings panel anywhere inside the provider:

```tsx
import { SoundHapticsSettingsPanel } from './sound-haptics-controller/SoundHapticsSettingsPanel';

function SettingsPage() {
  return <SoundHapticsSettingsPanel />;
}
```

## `useSoundFeedback()` API

```typescript
const {
  settings,          // SoundHapticsSettings
  updateSettings,    // (patch: Partial<SoundHapticsSettings>) => void
  playSound,         // (sound: SoundType) => void
  triggerHaptic,     // (pattern?: HapticPattern) => void
  isAudioSupported,  // boolean
  isHapticsSupported // boolean
} = useSoundFeedback();
```

### `SoundType`

`'click' | 'countdown' | 'win' | 'loss' | 'wager_placed'`

### `HapticPattern`

`'tap' | 'double_buzz' | 'success_rumble'`

### `SoundHapticsSettings`

```typescript
interface SoundHapticsSettings {
  masterVolume: number;   // 0..1
  sfxMuted: boolean;
  musicMuted: boolean;
  hapticsEnabled: boolean;
}
```

Persisted under the `stellarcade:sound-haptics-settings` localStorage key.

## Testing

```bash
npm test SoundHaptics.test.tsx
```

Covers: volume/mute state updates and clamping, localStorage persistence and
initialization (including malformed-JSON fallback), the click→tap /
win→success_rumble / loss→double_buzz haptic mapping, and graceful behavior
when `AudioContext` and/or `navigator.vibrate` are unavailable or throw.

## Known Limitations / Follow-ups

- Audio cues are synthesized oscillator tones rather than produced/mixed
  sound design assets; swapping in real SFX files (via `<audio>` or
  decoded `AudioBuffer`s) is a natural follow-up once assets are available.
- `useSoundFeedback()` outside a `SoundHapticsProvider` returns a safe no-op
  context (silent `playSound`/`triggerHaptic`, `isAudioSupported`/
  `isHapticsSupported` both `false`) rather than throwing, so it degrades
  gracefully but will not play anything — always wrap consumers in the
  provider for real functionality.
- This component has no local `package.json`, matching the other
  `experimental/ui/` widgets; it expects a host app with React, Vitest, and
  `@testing-library/react` already configured.
- `npm test` has not been executed in this environment (no local
  Node/npm/Vitest sandbox with the host app's dependencies installed); the
  test suite mocks `AudioContext`/`navigator.vibrate` and was reviewed by
  hand against the hook's actual behavior.

## License

MIT
