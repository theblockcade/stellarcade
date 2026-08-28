# Ambient Sound Mixer

An audio equalizer and sound mixer drawer for mixing background arcade
music, UI SFX, and ambient casino chatter, with preset soundscapes.

## Features

- Master volume slider with a mute toggle that disables all channel sliders
  **without discarding** their previously set values — unmuting restores
  the exact mix you had.
- Three independent channel sliders: Music, SFX, Ambient Noise (0–100).
- Four preset soundscape pills: Arcade 80s, Synthwave, Cyberpunk, Silent —
  selecting one sets channel levels while leaving master volume and mute
  state untouched.
- A small equalizer bar animation reflecting each channel's current level
  (collapses to a minimum height while muted).
- Persists the full config to `localStorage`, resilient to it being
  unavailable or throwing (private browsing, quota exceeded, corrupted
  stored JSON) — the mixer still works for the current session either way.

## Usage

```tsx
import { AmbientSoundMixer } from "./AmbientSoundMixer";

<AmbientSoundMixer
  isOpen={isOpen}
  onConfigChange={(config) => applyAudioConfig(config)}
  onClose={() => setIsOpen(false)}
/>
```

Pass `initialConfig` to seed a starting mix (e.g. from a user profile) — it
is only used the first time nothing is found in `localStorage`.

## Testing

```bash
npm install
npm test
```
