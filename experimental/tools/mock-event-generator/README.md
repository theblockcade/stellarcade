# Mock Event Generator CLI

A Node.js/TypeScript CLI utility for emitting synthetic Soroban contract events for local UI and indexing tests.

## Features

- **Multiple Event Types**: Support for arcade game event streams (match_started, wager_deposited, round_settled, jackpot_won)
- **Configurable Intervals**: Control event stream rate (e.g., 1 event every 2 seconds)
- **Payload Generation**: Random or pre-set payload generation for realistic testing
- **Colored Terminal Output**: Beautiful formatted output with colors for easy reading
- **JSON Mode**: Raw JSON dump mode for programmatic consumption
- **Streaming Mode**: Continuous event emission until interrupted
- **SIGINT Handling**: Clean exit on Ctrl+C

## Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Link globally (optional)
npm link
```

## Usage

### Basic Usage

```bash
# Emit 10 match_started events with 2 second intervals
node dist/index.js emit --event match_started --count 10 --interval-ms 2000

# Stream wager_deposited events continuously
node dist/index.js stream --event wager_deposited --interval-ms 1000
```

### Command Options

#### `emit` Command

Emits a specified number of events and exits.

```bash
node dist/index.js emit [options]
```

**Options:**
- `--event <type>`: Event type to emit (default: `match_started`)
  - Available: `match_started`, `wager_deposited`, `round_settled`, `jackpot_won`
- `--interval-ms <ms>`: Interval between events in milliseconds (default: `2000`)
- `--count <number>`: Number of events to emit (default: `10`)
- `--rpc-url <url>`: Soroban RPC URL (default: `http://localhost:8000`)
- `--contract-id <id>`: Contract ID to emit events for (default: `default_contract_id`)
- `--random`: Use random payload generation (default: `false`)
- `--json`: Output raw JSON instead of formatted text (default: `false`)

#### `stream` Command

Continuously streams events until interrupted with Ctrl+C.

```bash
node dist/index.js stream [options]
```

**Options:** Same as `emit` command, except `--count` is not applicable (streams infinitely).

### Examples

#### Emit Match Started Events

```bash
# Default configuration
node dist/index.js emit --event match_started

# Custom configuration
node dist/index.js emit \
  --event match_started \
  --count 5 \
  --interval-ms 3000 \
  --rpc-url https://horizon-testnet.stellar.org \
  --contract-id CA3D5KRYM6CB7OWQ6TWYRR3Z4T7VNZTRJAALQSKS7VDCERKVMO6A4RYT
```

#### Stream Wager Deposited Events with Random Payloads

```bash
node dist/index.js stream \
  --event wager_deposited \
  --interval-ms 1500 \
  --random
```

#### JSON Output Mode

```bash
node dist/index.js emit \
  --event round_settled \
  --count 3 \
  --json
```

#### Jackpot Events with High Frequency

```bash
node dist/index.js stream \
  --event jackpot_won \
  --interval-ms 500 \
  --random
```

## Event Types

### match_started

Emitted when a new game match begins.

**Payload:**
```typescript
{
  matchId: string;
  player: {
    publicKey: string;
    secretKey?: string;
  };
  wager: {
    amount: string;
    asset: string;
  };
  gameType: string;
}
```

### wager_deposited

Emitted when a player deposits a wager.

**Payload:**
```typescript
{
  matchId: string;
  player: {
    publicKey: string;
    secretKey?: string;
  };
  amount: {
    amount: string;
    asset: string;
  };
  timestamp: string;
}
```

### round_settled

Emitted when a game round is settled.

**Payload:**
```typescript
{
  matchId: string;
  winner: {
    publicKey: string;
    secretKey?: string;
  };
  loser: {
    publicKey: string;
    secretKey?: string;
  };
  result: string; // 'win', 'loss', 'draw'
  payout: {
    amount: string;
    asset: string;
  };
}
```

### jackpot_won

Emitted when a jackpot is won.

**Payload:**
```typescript
{
  matchId: string;
  winner: {
    publicKey: string;
    secretKey?: string;
  };
  jackpotAmount: {
    amount: string;
    asset: string;
  };
  totalPlayers: number;
}
```

## Development

### Build

```bash
npm run build
```

### Development Mode

```bash
npm run dev -- emit --event match_started --count 5
```

### Testing

```bash
npm test
```

## Output Examples

### Formatted Output

```
🚀 Mock Event Generator
RPC URL: http://localhost:8000
Contract ID: default_contract_id
Event Type: match_started
Interval: 2000ms
Random Payload: No
Count: 3

[1] MATCH_STARTED
  Time: 2026-08-24T21:30:45.123Z
  Contract: default_contract_id
  Payload:
    matchId: match_1724535845123_abc123def
    player:
      publicKey: GABCDEFGHJKLMNPQRSTUVWXYZ234567ABCDEFGHJKLMNPQRSTUVWXYZ2
    wager:
      amount: 100.00
      asset: XLM
    gameType: coin-flip

[2] MATCH_STARTED
  Time: 2026-08-24T21:30:47.124Z
  Contract: default_contract_id
  Payload:
    matchId: match_1724535847124_xyz456ghi
    player:
      publicKey: GABCDEFGHJKLMNPQRSTUVWXYZ234567ABCDEFGHJKLMNPQRSTUVWXYZ2
    wager:
      amount: 100.00
      asset: XLM
    gameType: coin-flip

✅ Emitted 3 events successfully
```

### JSON Output

```json
{
  "type": "match_started",
  "timestamp": "2026-08-24T21:30:45.123Z",
  "contractId": "default_contract_id",
  "payload": {
    "matchId": "match_1724535845123_abc123def",
    "player": {
      "publicKey": "GABCDEFGHJKLMNPQRSTUVWXYZ234567ABCDEFGHJKLMNPQRSTUVWXYZ2"
    },
    "wager": {
      "amount": "100.00",
      "asset": "XLM"
    },
    "gameType": "coin-flip"
  }
}
```

## Help

```bash
# General help
node dist/index.js --help

# Command-specific help
node dist/index.js emit --help
node dist/index.js stream --help
```

## License

MIT