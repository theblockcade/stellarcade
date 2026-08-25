# Match Replay Visualizer

An interactive Terminal UI (TUI) for stepping through a Soroban arcade match's recorded move history — built for developers and arbiters debugging disputes or verifying game outcomes.

## Features

- **Step-by-Step Navigation**: Move forward/backward through a match's recorded moves one at a time
- **Auto-Play Mode**: Automatically step through the whole match on a timer
- **Multi-Game Rendering**: ASCII/Unicode board renderers for Rock-Paper-Scissors, Dice, Matrix (memory grid), and Trivia
- **Deterministic State Machine**: The same match record always replays to the same sequence of states — no dependency on wall-clock time
- **Defensive Parsing**: Corrupt or incomplete individual moves are skipped with a warning rather than crashing the whole replay
- **Clear Error Messages**: An unknown match id or unsupported game type fails fast with a specific message

## Installation

```bash
cd experimental/tools/match-replay-visualizer
npm install
npm run build
```

## Usage

```bash
# Interactive mode (requires a TTY)
npx tsx src/index.ts --match-id match-1 --fixtures examples/sample-matches.json

# Auto-play through the whole match
npx tsx src/index.ts --match-id match-1 --fixtures examples/sample-matches.json --auto-play

# Against a live deployment (RPC lookup is not implemented in this
# prototype — see the note in src/index.ts's loadMatches())
npx tsx src/index.ts --match-id match-1 --rpc-url https://soroban-rpc.example.com
```

### Keyboard Controls

| Key | Action |
|---|---|
| `→` or `Space` | Next move |
| `←` | Previous move |
| `e` | Jump to end (final/settled state) |
| `s` | Jump to start (initial state) |
| `q` or `Ctrl+C` | Quit |

When stdin is not a TTY (e.g. piped input, CI), the tool prints every step non-interactively instead of waiting for keypresses.

## Supported Game Types

| Game | Move data shape | Rendering |
|---|---|---|
| `rock-paper-scissors` | `{ choice: 'rock' \| 'paper' \| 'scissors' }` | Per-player emoji + choice |
| `dice` | `{ value: number }` | Rolled die face |
| `matrix` | `{ gridSize?: number, cell: number }` | ASCII grid with revealed cells |
| `trivia` | `{ roundIdx: number, revealed: boolean }` | Round + commit/reveal status |

## Error Handling

- **Unknown match ID**: exits with a clear `Match not found: <id>` message and non-zero exit code.
- **Unsupported game type**: the match is skipped with a warning rather than crashing the whole load.
- **Corrupt/incomplete move data**: individual bad moves are skipped with a warning; the rest of the match still replays.
- **Unfinalized match**: replay proceeds up to the latest known move, with a clear on-screen notice that the match has no recorded outcome yet.

## Testing

```bash
npm test
```

Covers the match-history parser (well-formed input, corrupt moves, malformed outcomes, unknown game types) and the step state machine (`initial -> move 1 -> move 2 -> settled`, including bounds checking on next/previous/jump).

## License

MIT
