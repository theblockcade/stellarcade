# @stellarcade/cpu-budget-profiler

Profiling CLI that simulates a Soroban contract method invocation via RPC, extracts CPU instruction and memory consumption from the simulation's cost envelope, and reports budget utilization against network limits.

## Features

- Simulates any contract method call (no real transaction submitted)
- Extracts `cpuInsns`/`memBytes` from the simulation's `cost` field
- Compares against network ceilings (100M CPU instructions, 40 MiB memory per transaction)
- Colored budget gauge: 🟢 Green < 20%, 🟡 Yellow 20–80%, 🔴 Red > 80%
- Markdown benchmark table export via `--out`
- `--json` output mode for scripting

## Installation

```bash
npm install @stellarcade/cpu-budget-profiler
```

## Usage

```bash
cpu-budget-profiler --contract-id CABC...XYZ --method transfer --args '["GDEST...", "1000"]'
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--contract-id <id>` | Contract ID (C...) to profile | (required) |
| `--method <name>` | Contract method to simulate | (required) |
| `--args <json>` | JSON array of arguments | `[]` |
| `--rpc-url <url>` | Soroban RPC endpoint | `https://soroban-testnet.stellar.org` |
| `--source-account <id>` | Source account (G...) to simulate from | a throwaway keypair |
| `--json` | Output result as JSON | `false` |
| `--out <path>` | Write a markdown benchmark table to this path | |
| `-V, --version` | Output the version number | |
| `-h, --help` | Display help for command | |

### Sample benchmark report

```markdown
| Contract | Method | CPU Instructions | CPU % | Memory (bytes) | Memory % | Status |
|---|---|---|---|---|---|---|
| CABC...XYZ | transfer | 4,210,553 | 4.2% | 812,400 | 1.9% | 🟢 OK |
```

### Examples

Basic profile:
```bash
cpu-budget-profiler --contract-id CABC...XYZ --method get_balance --args '["GDEST..."]'
```

JSON output for CI:
```bash
cpu-budget-profiler --contract-id CABC...XYZ --method transfer --args '["GDEST...", "1000"]' --json
```

Write a benchmark table:
```bash
cpu-budget-profiler --contract-id CABC...XYZ --method transfer --args '["GDEST...", "1000"]' --out benchmark.md
```

## Note on the budget gauge boundary

The `Yellow`/`Red` boundary is 80%: usage above 80% of a network limit is
`Red`, and 20–80% is `Yellow`. (An earlier spec draft mentioned a 60% cutoff
for `Yellow`, which would leave 60–80% uncolored — this implementation
closes that gap by treating the full 20–80% range as `Yellow`.)

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Run in development mode
npm run dev
```

## License

MIT
