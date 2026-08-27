# Contract Gas Benchmark & Load Simulator CLI (`@stellarcade/gas-benchmark-runner`)

CLI benchmarking tool in the StellarCade experimental workspace for stress-testing a single Soroban contract method under simulated concurrent load, and reporting gas / latency / resource-fee statistics.

## Features

- **Batch Simulated Invocations**: Fires `--iterations` simulated contract calls bounded by `--concurrency` in-flight requests at a time.
- **Rich Metrics**: Collects per-invocation latency, CPU instructions, memory usage, and resource fee (stroops).
- **Percentile Analysis**: Computes p50 / p90 / p99 for both latency and CPU instructions.
- **Dual Report Export**: Writes a full JSON report and a Markdown summary table (via `--output`).
- **Pluggable Simulation**: The underlying `runBenchmark` function accepts an injectable simulate function, so it can be pointed at a real Soroban RPC `simulateTransaction` call instead of the built-in randomized simulator.

## Usage

### Command Line Interface

```bash
# Benchmark a contract method with defaults (100 iterations, concurrency 10)
npx tsx src/index.ts --contract CABCDEF... --method transfer

# Custom iteration count / concurrency, exporting a report
npx tsx src/index.ts \
  --contract CABCDEF... \
  --method place_bet \
  --iterations 500 \
  --concurrency 25 \
  --output ./reports/place_bet.json
```

### CLI Options

| Flag | Description | Default |
|---|---|---|
| `-c, --contract <id>` | Contract ID or alias to benchmark (required) | - |
| `-m, --method <name>` | Contract method to invoke (required) | - |
| `-i, --iterations <count>` | Number of simulated invocations | `100` |
| `-n, --concurrency <count>` | Maximum in-flight invocations at a time | `10` |
| `-r, --rpc-url <url>` | Soroban RPC endpoint URL | `https://soroban-testnet.stellar.org` |
| `-o, --output <path>` | Output JSON report path; a companion `.md` summary is written alongside it | `undefined` |

## Sample Markdown Summary Output

```text
# Gas Benchmark Report

- **Contract**: `CABCDEF...`
- **Method**: `transfer`
- **Iterations**: 100 (concurrency: 10)
- **Timestamp**: 2026-08-27T12:00:00.000Z
- **Success / Failure**: 97 / 3

| Metric | Avg | Min | Max | p50 | p90 | p99 |
|---|---|---|---|---|---|---|
| Latency (ms) | 108 | 20 | 199 | 105 | 175 | 197 |
| CPU instructions | 2748213 | 512044 | 4991820 | 2701552 | 4488210 | 4970112 |
| Memory (bytes) | 149832 | 50120 | 249710 | - | - | - |

| Resource fee | Value |
|---|---|
| Avg (stroops) | 375 |
| Min (stroops) | 151 |
| Max (stroops) | 599 |
| Total (stroops) | 36375 |
```

## Development & Testing

```bash
# Install dependencies
npm install

# Run unit test suite with Vitest
npm test
```

The test suite covers the statistical calculation utilities (`mean`, `median`, `percentile`, `calculatePercentiles`) and a mock integration test that runs `runBenchmark` with an injected simulate function to verify concurrency bounds, result ordering, and failure handling without making any real network calls.

## Design Notes

- **No real RPC calls by default**: `defaultSimulateInvocation` generates randomized-but-plausible latency/CPU/memory/fee values so the tool is usable standalone without a live Soroban RPC endpoint or funded account. To benchmark against a real network, swap in a `SimulateInvocationFn` that calls the Soroban RPC `simulateTransaction` method and maps the response into an `InvocationResult`.
- **Percentiles use nearest-rank**: consistent with the `throughput-latency-tester` tool elsewhere in this workspace, so reports are comparable across tools.
- **Concurrency via semaphore**: a small counting semaphore caps in-flight invocations at `--concurrency`, rather than chunking iterations into fixed batches, so throughput ramps smoothly as earlier invocations complete.
