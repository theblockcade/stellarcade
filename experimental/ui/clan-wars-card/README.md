# clan-wars-card

Weekly clan wars overview: top-5 guild standings, a territory-dominance progress bar, a season countdown, and the user's own clan pinned when it falls outside the top 5.

## Usage

```tsx
import { ClanWarsCard } from "@stellarcade/clan-wars-card";

<ClanWarsCard
  clans={[
    { clanId: "1", clanName: "Dragon Slayers", badgeIcon: "🐉", memberCount: 50, territoryControlPercent: 32 },
    { clanId: "2", clanName: "Star Raiders", badgeIcon: "⭐", memberCount: 42, territoryControlPercent: 28 },
  ]}
  userClanId="2"
  seasonEndsAt="2026-09-01T00:00:00Z"
  prizePoolXlm={50000}
  onContribute={() => openContributeModal()}
/>
```

## Behavior

- Clans are sorted by `territoryControlPercent` descending; only the top 5 render in the standings list and the territory bar.
- If `userClanId` is within the top 5, that row gets `clan-standing-row--user`. If it's outside, a separate pinned row renders below the top 5 with `clan-standing-row--pinned`, still showing its true rank.
- The territory bar's segment widths are proportionally normalized (`normalizeTerritoryShares`) so they always visually sum to 100%, even if the raw percentages don't add up exactly.
- The countdown (`{d}d {h}h {m}m` format) re-renders every second via an interval, floored at zero once the season ends.
- `onContribute` (optional) renders a "Contribute Points" button.

## Props

| Prop | Type | Description |
|---|---|---|
| `clans` | `ClanStanding[]` | All competing clans (unsorted — sorting happens internally). |
| `userClanId` | `string?` | The viewing user's clan id, for highlighting/pinning. |
| `seasonEndsAt` | `string` | ISO timestamp the season ends at. |
| `prizePoolXlm` | `number` | Season prize pool, displayed formatted. |
| `onContribute` | `() => void` | Optional. Renders a contribute button when provided. |

## Development

```bash
npm install
npm test
```
