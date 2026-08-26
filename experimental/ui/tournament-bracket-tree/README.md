# TournamentBracketTree

An interactive tournament bracket tree component for rendering single-elimination playoff structures.

## Features
- Horizontal round layout (Quarterfinals, Semifinals, Finals)
- Matchup card displaying player handles, avatars, scores, and win/loss highlights
- Dynamic SVG connector path visualizer
- Player progression path highlighting
- Interactive matchup selection callback
- Zoom/pan controls for large tournament brackets

## Usage
```tsx
import { TournamentBracketTree } from './TournamentBracketTree';

<TournamentBracketTree
  bracketData={bracketTreeData}
  onSelectMatchup={handleSelectMatchup}
  highlightPlayerId="player-123"
/>
```
