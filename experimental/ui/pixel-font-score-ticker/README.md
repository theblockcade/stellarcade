# Pixel Font Score Ticker

Experimental retro-style score counter with mechanical digit flip animation.

## Features
- Configurable digit count (default: 6)
- Smooth digit flip/scroll transitions
- Arcade sound cue callback system
- High-score flash animation
- Multiple color themes (Neon Amber, Classic CRT Green, Cyber Blue)
- Respects `prefers-reduced-motion` media query

## Usage

```tsx
import PixelScoreTicker from '@stellarcade/experimental/ui/pixel-font-score-ticker';

<PixelScoreTicker
  value={currentScore}
  digits={6}
  theme="amber"
  onTickSound={() => playSound('digit_tick')}
/>
```

## Props

| Prop          | Type                     | Default       | Description                          |
|---------------|--------------------------|---------------|--------------------------------------|
| value         | number                   | -             | Current score value                 |
| digits        | number                   | 6             | Number of digits to display         |
| durationMs    | number                   | 1000          | Animation duration in milliseconds  |
| theme         | 'amber' | 'crt-green' | 'cyber-blue' | 'amber' | Color theme variant |
| onTickSound   | () => void               | -             | Callback for digit tick sound       |
