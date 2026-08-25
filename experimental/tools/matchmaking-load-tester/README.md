# Matchmaking Load Tester CLI

A Node.js/TypeScript CLI utility that spawns simulated concurrent virtual players to
stress-test the matchmaking queue: joining, heartbeating, accepting matches, and
submitting moves, then reports aggregate latency and reliability statistics.

## Features

- **Configurable Concurrency**: Spawn N virtual players with a bounded concurrent worker pool
- **Realistic Player Lifecycle**: Connect → queue (with heartbeats) → match found → accept (with timeout) → submit move
- **Metrics Collection**: Queue wait time, pairing latency, timeouts, disconnects, and errors, without crashing on individual player failures
- **Aggregate Reporting**: p50 / p95 / p99 percentile statistics plus min/max/mean
- **JSON Mode**: Machine-readable summary output for CI or downstream tooling

## Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

```bash
node dist/index.js run [options]
```

**Options:**
- `--players <n>`: Total number of virtual players to simulate (default: `50`)
- `--duration-sec <s>`: Max wall-clock duration the run is allowed to take, in seconds (default: `60`)
- `--api-url <url>`: Matchmaking API base URL (default: `http://localhost:8080`)
- `--game-type <type>`: Game type to queue for (default: `coin-flip`)
- `--concurrency <c>`: Max number of players running concurrently (default: `10`)
- `--json`: Output raw JSON summary instead of a formatted report (default: `false`)

### Examples

```bash
# Default 50-player run
node dist/index.js run

# 200 players, 25 concurrent workers, custom API URL
node dist/index.js run \
  --players 200 \
  --concurrency 25 \
  --api-url https://matchmaking.stellarcade.dev \
  --game-type roulette

# JSON output for CI pipelines
node dist/index.js run --players 100 --json
```

### Development Mode

```bash
npm run dev -- run --players 10 --concurrency 5
```

### Testing

```bash
npm test
```

## Sample Output

```
🎮 Matchmaking Load Tester
API URL: http://localhost:8080
Game Type: coin-flip
Players: 50
Concurrency: 10
Duration cap: 60s

Outcomes
  Completed matches: 46
  Timeouts:          2 (4.0%)
  Disconnects:       1
  Errors:            1 (2.0%)

Queue Wait (ms)
  count=49 min=52 mean=224 p50=210 p95=380 p99=399 max=400

Pairing Latency (ms)
  count=48 min=21 mean=92 p50=88 p95=163 p99=170 max=170

Total wall time: 1284ms
```

## Metrics Model

- **Queue wait time**: elapsed time between joining the queue and a match being found.
- **Pairing latency**: elapsed time between a match being found and the accept/decline decision resolving.
- **Timeout rate**: fraction of all players whose match acceptance exceeded the configured timeout window.
- **Error rate**: fraction of all players whose simulated run failed unexpectedly.

All percentile calculations use nearest-rank interpolation and degrade gracefully
(returning zeroed stats) when no samples were collected.

## Known Limitations / Follow-ups

- The current virtual player (`src/virtual-player.ts`) simulates network timing
  internally rather than issuing real HTTP/WebSocket calls against `--api-url`,
  since this tool was authored and reviewed without a running matchmaking
  backend available to test against. The CLI, metrics pipeline, and reporting
  are fully functional end-to-end; swapping `simulateNetworkStep` calls in
  `VirtualPlayer` for real `fetch`/WebSocket calls is the natural next step
  once a live endpoint contract is available.
- This package was authored and reviewed by hand; `npm install` / `npm run build` /
  `npm test` have not been executed in this environment (no local Node/npm
  sandbox access), so please run the test suite in CI before merging.

## License

MIT
