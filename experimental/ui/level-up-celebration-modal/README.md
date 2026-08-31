# LevelUpCelebrationModal

An experimental splash modal that celebrates a player leveling up, with an animated level-counter, XP progress bar toward the next level, unlocked perks list, and share shortcut.

## Features
- Counts up from the previous level to the new level over ~800ms
- Rotating burst-ray backdrop accent behind the card
- XP progress bar showing progress into the next level
- Optional list of perks unlocked at the new level
- Keyboard accessible (ESC key to dismiss) and optional auto-dismiss timer

## Usage
```tsx
import { LevelUpCelebrationModal } from './LevelUpCelebrationModal';

<LevelUpCelebrationModal
  isOpen={showLevelUp}
  previousLevel={4}
  newLevel={5}
  xpIntoLevel={120}
  xpForNextLevel={500}
  unlockedPerks={[{ label: 'Golden avatar frame', icon: '🖼️' }]}
  onClose={() => setShowLevelUp(false)}
  onShare={(platform) => shareResult(platform)}
/>
```

## Status

Experimental — not wired into the main app. See `experimental/README.md` for how components here graduate into `apps/web`.
