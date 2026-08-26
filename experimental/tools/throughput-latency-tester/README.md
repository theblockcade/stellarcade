# Throughput Latency Tester

A Node.js/TypeScript CLI utility that benchmarks throughput (TPS) and latency percentiles under configurable concurrency loads against simulated Soroban transactions. Useful for measuring the performance characteristics of the benchmarking framework itself.

## Features

- **Configurable Concurrency**: Set max concurrent transactions with a bounded worker pool
- **Ramp-up Control**: Gradually increase concurrency from 1 to target over a configurable duration
- **Latency Percentiles**: p50, p90, p95, p99 percentile calculations from sorted latency samples
- **TPS Metrics**: Peak TPS (max transactions in any 1-second window) and sustained TPS
- **ASCII Histogram**: Terminal-friendly latency distribution bar chart
- **Simulated Transactions**: Measures framework throughput without requiring a live RPC endpoint

## Installation

```bash
npm install
npm run build
```

## Usage

```bash
node dist/index.js run [options]
```

### Examples

```bash
# Default 100-request benchmark
node dist/index.js run --contract-id CABC123DEF456

# 500 requests, 50 concurrent, custom ramp-up
node dist/index.js run \
  --contract-id CABC123DEF456 \
  --total 500 \
  --concurrency 50 \
  --ramp-up-ms 5000

# Quick test with low concurrency
node dist/index.js run --contract-id CABC123DEF456 --total 20 --concurrency 5
```

### Development Mode

```bash
npm run dev -- run --contract-id CABC123DEF456 --total 10 --concurrency 3
```

## Options

| Option | Description | Default |
|---|---|---|
| `--contract-id <id>` | Soroban contract ID to target (required) | - |
| `--method <m>` | Contract method to invoke | `transfer` |
| `--total <n>` | Total number of transactions to fire | `100` |
| `--concurrency <c>` | Maximum concurrent transactions | `10` |
| `--rpc-url <url>` | Soroban RPC endpoint URL | `http://localhost:8000/soroban/rpc` |
| `--ramp-up-ms <ms>` | Time in ms to ramp concurrency from 1 to target | `2000` |

## Testing

```bash
npm test
```

## License

MIT
