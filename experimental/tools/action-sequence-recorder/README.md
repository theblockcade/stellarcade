# Action Sequence Recorder

Record and replay arcade game action sequences for QA testing and regression detection.

## Overview

This experimental tool captures game input sequences (button presses, movements, abilities) with precise timing deltas, compresses them into portable session files, and replays them deterministically to verify game behavior consistency.

## Install

```bash
npm install
```

## Usage

### Record a session

```bash
npx tsx src/index.ts record --game-id space-invaders --out ./session.json.gz --actions 50
```

| Flag | Description | Default |
|------|-------------|---------|
| `--game-id <id>` | Game identifier | (required) |
| `--out <path>` | Output file path | `./session.json.gz` |
| `--actions <count>` | Number of mock actions | `50` |

### Replay a session

```bash
npx tsx src/index.ts replay --file ./session.json.gz --speed 2x
```

| Flag | Description | Default |
|------|-------------|---------|
| `--file <path>` | Session file to replay | (required) |
| `--speed <1x\|2x\|max>` | Playback speed multiplier | `1x` |

## Session File Format

Session files are gzip-compressed JSON. The uncompressed structure:

```json
{
  "gameId": "space-invaders",
  "recordedAt": "2026-08-28T12:00:00.000Z",
  "actions": [
    {
      "type": "move_left",
      "payload": { "direction": "left", "distance": 1 },
      "timestamp": 1724846400100,
      "deltaMs": 83
    },
    {
      "type": "fire",
      "payload": { "weapon": "laser", "ammo": 1 },
      "timestamp": 1724846400183,
      "deltaMs": 67
    }
  ],
  "metadata": {
    "actionCount": 50,
    "totalDurationMs": 12450,
    "mockMode": true
  }
}
```

### Action Types

| Type | Payload |
|------|---------|
| `move_left` | `direction`, `distance` |
| `move_right` | `direction`, `distance` |
| `jump` | `height`, `duration` |
| `fire` | `weapon`, `ammo` |
| `pause` | `{}` |
| `resume` | `{}` |
| `select_powerup` | `powerupId`, `slot` |
| `collect_coin` | `coinId`, `value` |
| `dodge_obstacle` | `obstacleId`, `direction` |
| `use_ability` | `ability`, `cooldownMs` |

## Determinism Verification

The replay player computes a state hash after each step. After replaying all actions, the final hash is compared to the original session hash. If they differ, the divergence point is reported.

## Testing

```bash
npm test
```

## Architecture

```
src/
  index.ts          CLI entry point (commander)
  recorder.ts       Action recording, session creation, gzip I/O
  player.ts         Replay engine, state hashing, determinism checks
  recorder.test.ts  Tests for serialization/deserialization
  player.test.ts    Tests for replay execution
```

## License

MIT
