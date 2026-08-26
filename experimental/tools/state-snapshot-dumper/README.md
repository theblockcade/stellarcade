# Soroban Contract State Snapshot Dumper CLI

A Node.js / TypeScript CLI utility that exports Soroban on-chain contract state entries into structured JSON and tabular CSV snapshot exports for offline analysis.

## Features

- **RPC & Local Input Support**: Queries Soroban RPC endpoint or imports local state dump JSON files (`--entries-file`).
- **XDR & Complex Type Decoding**: Decodes SCVal storage keys and values (integers, strings, symbols, addresses, vectors, maps, structs).
- **Format Options**: Export snapshot as pretty-printed JSON (`--format json`) or tabular CSV with headers (`--format csv`).
- **Durability Filtering**: Filter state entries by storage durability (`--durability instance | persistent | temporary | all`).
- **CSV Escaping**: Properly escapes commas, quotes, and newlines in tabular outputs.

## Usage

```bash
npx tsx src/index.ts --contract-id <id> [--rpc-url <url>] [--format json|csv] [--durability <type>] [--out <path>] [--entries-file <path>]
```

### Options

- `-c, --contract-id <id>` (required): Target Soroban contract ID.
- `-r, --rpc-url <url>`: Soroban RPC endpoint URL (default: `https://soroban-testnet.stellar.org`).
- `-f, --format <format>`: Export format: `json` or `csv` (default: `json`).
- `-d, --durability <type>`: Storage type filter: `instance`, `persistent`, `temporary`, or `all` (default: `all`).
- `-o, --out <path>`: File path to save output snapshot.
- `-e, --entries-file <path>`: Local JSON file containing raw storage entries for offline dumping.

### Examples

```bash
# Dump contract state to JSON
npx tsx src/index.ts \
  --contract-id CBVNIITX42KQA3MKNUBKG4YIK4FCASZQWKWGHY3YYMM4ANGZ6MOZI2EC \
  --format json \
  --out ./snapshots/contract-state.json

# Dump persistent storage entries to CSV
npx tsx src/index.ts \
  --contract-id CBVNIITX42KQA3MKNUBKG4YIK4FCASZQWKWGHY3YYMM4ANGZ6MOZI2EC \
  --durability persistent \
  --format csv \
  --out ./snapshots/persistent-state.csv
```

## Testing

Run unit tests with Vitest:

```bash
npx vitest run
```
