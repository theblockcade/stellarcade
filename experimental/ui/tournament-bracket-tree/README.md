# Tournament Bracket Tree

A responsive single-elimination tournament bracket visualizer. Renders player pairings,
round milestones, match scores, and winner highlight paths with SVG connector lines — fully
self-contained in the experimental workspace.

## Features

- **Round columns** (Quarterfinals, Semifinals, Finals, ...) driven by `TournamentRound[]`.
- **Match cards** with player initials/avatars, usernames, scores, and Win/Loss styling.
- **SVG connector lines** that scale cleanly across viewports (`preserveAspectRatio="none"`).
- **Interactive path highlighting** on hover/focus — a player's route across the bracket
  lights up.
- **View toggle** to switch between a scrollable mobile compact view and the full desktop
  bracket.
- **Keyboard navigation** — match cards are focusable and selectable with Enter/Space.
- **Honest empty state** when round fixtures are not yet seeded.
- **No coupling** to `apps/web/app` core dashboard pages.

## Installation

```bash
cp -r experimental/ui/tournament-bracket-tree /path/to/your/components/
```

## Usage

```tsx
import { TournamentBracketTree } from './tournament-bracket-tree/TournamentBracketTree';
import type { TournamentRound } from './tournament-bracket-tree/types';

const rounds: TournamentRound[] = [
  {
    id: 'qf',
    name: 'Quarterfinals',
    matches: [
      {
        id: 'qf-0',
        round: 0,
        matchIndex: 0,
        players: [{ id: 'p1', name: 'Alpha' }, { id: 'p2', name: 'Bravo' }],
        scores: [2, 1],
        winnerId: 'p1',
        status: 'completed',
      },
      // ...remaining Quarterfinal matches
    ],
  },
  // Semifinals, Finals...
];

function MyBracket() {
  return (
    <TournamentBracketTree
      rounds={rounds}
      activeMatchId="sf-0"
      onSelectMatch={(match) => console.log('selected', match.id)}
    />
  );
}
```

## Props

| Prop             | Type                                       | Default   | Description                              |
|------------------|--------------------------------------------|-----------|------------------------------------------|
| `rounds`         | `TournamentRound[]`                        | required  | The bracket rounds                       |
| `activeMatchId`  | `string`                                   | —         | Match card to highlight as active        |
| `onSelectMatch`  | `(match: TournamentMatch) => void`         | —         | Fired when a match card is selected      |
| `className`      | `string`                                   | `''`      | Extra class names                        |
| `testId`         | `string`                                   | `'tournament-bracket-tree'` | Root test id    |
| `defaultView`    | `'compact' \| 'full'`                      | `'full'`  | Initial bracket view                     |

## Data model

- `TournamentRound` — `{ id, name, matches }`.
- `TournamentMatch` — players pair, scores, `winnerId`, and `status`
  (`pending | live | completed`).
- Players may be `null` until seeded; unseeded slots render as `TBD` placeholders.

## Connectors

Between every pair of consecutive rounds an SVG connector column joins each match centre to
its next-round slot (`matchIndex` → `Math.floor(matchIndex / 2)`). The SVG uses
`preserveAspectRatio="none"`, so lines stretch with any viewport width.

## Accessibility

- Match cards use `role="button"`, `tabIndex={0}`, respond to Enter/Space, and expose
  focus-visible outlines.
- Player rows light up on hover/focus, highlighting a competitor's path through the bracket.
- The bracket is a labelled `region`, and the connector layer is `aria-hidden`.

## Testing

```bash
npx vitest run experimental/ui/tournament-bracket-tree/TournamentBracketTree.test.tsx
```

Covered scenarios:

- Standard 8-player / 3-round bracket data renders 7 match cards and round names.
- Empty rounds render the empty-state message.
- Clicking a match card triggers `onSelectMatch`.
- Keyboard activation (Enter/Space), winner/loser styling, view toggle, and connector
  rendering.