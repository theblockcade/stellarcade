# Ledger Transaction Latency & Fee Tracker CLI (`@stellarcade/latency-fee-tracker`)

CLI monitor utility in the StellarCade experimental workspace for tracking recent Stellar network ledgers and analyzing transaction latency and fee metrics.

## Features

- **Ledger Latency Analysis**: Calculates average transaction latency across sampled ledgers.
- **Fee Distribution Metrics**: Computes average, minimum, and maximum fee in stroops.
- **Flexible Exporters**: Emits formatted text summary to `stdout` or dumps JSON reports via `--json-out`.
- **Fault-Tolerant Network Logic**: Provides clear diagnostic error messages if RPC endpoints fail or timeout.

## Usage

### Command Line Interface

```bash
# Sample default 10 ledgers from Stellar Testnet
npx tsx src/index.ts

# Sample 20 ledgers from custom RPC endpoint and export JSON report
npx tsx src/index.ts --rpc-url https://horizon.stellar.org --ledgers 20 --json-out ./metrics.json
```

### CLI Options

| Flag | Description | Default |
|---|---|---|
| `-r, --rpc-url <url>` | Horizon / Soroban RPC endpoint URL | `https://horizon-testnet.stellar.org` |
| `-l, --ledgers <count>` | Number of ledgers to sample | `10` |
| `-j, --json-out <path>` | Optional filepath to write JSON report | `undefined` |

## Sample Summary Output

```text
==================================================
       Stellar Ledger Latency & Fee Report        
==================================================
RPC Endpoint        : https://horizon-testnet.stellar.org
Timestamp           : 2026-08-26T08:45:00.000Z
Sampled Ledgers     : 10
Total Transactions  : 42
--------------------------------------------------
Average Latency (ms): 1485 ms
Average Fee (stroop): 100 stroops
Minimum Fee (stroop): 100 stroops
Maximum Fee (stroop): 250 stroops
==================================================
```

## Development & Testing

```bash
# Install dependencies
npm install

# Run unit test suite with Vitest
npm test
```
