# @stellarcade/territory-domination-map

Experimental territory domination SVG map widget for StellarCade.

## Components

- **`TerritoryDominationMap`** — SVG map showing territory grid with ownership colors, contested markers, leaderboard, and click-to-select interaction
- **`TerritorySector`** — individual territory rect with label, resource value, and contested icon

## Usage

```tsx
import { TerritoryDominationMap } from "@stellarcade/territory-domination-map";

<TerritoryDominationMap
  territories={territories}
  players={players}
  currentPlayerId="p1"
  selectedTerritoryId={selected}
  onTerritoryClick={handleTerritoryClick}
  width={600}
  height={400}
/>
```

## Testing

```bash
npm test
```
