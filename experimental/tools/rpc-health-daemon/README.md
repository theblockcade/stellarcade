# @stellarcade/rpc-health-daemon

Standalone Soroban RPC node health monitoring daemon with Prometheus metrics export.

Issue #1177

## Overview

This daemon periodically pings a Soroban RPC endpoint (`getHealth` and `getLatestLedger`) and exposes the results as Prometheus-compatible metrics on an HTTP server. It detects:

- **Node unhealthy** -- RPC returns non-OK status or connection fails
- **Ledger stalled** -- Ledger sequence does not advance for more than 30 seconds
- **Latency spikes** -- Response time exceeds 1000ms

## Installation

```bash
npm install
```

## Usage

```bash
npx tsx src/index.ts --rpc-url https://soroban-testnet.stellar.org --interval-sec 5 --port 9090
```

### CLI Options

| Flag | Default | Description |
|---|---|---|
| `--rpc-url <url>` | `https://soroban-testnet.stellar.org` | Soroban RPC endpoint to monitor |
| `--interval-sec <n>` | `5` | Seconds between health checks |
| `--port <n>` | `9090` | Port for the Prometheus metrics HTTP server |

## Metrics Endpoint

The daemon exposes a `/metrics` endpoint on the configured port in Prometheus text format:

```
# HELP soroban_rpc_health_status Whether the RPC node is healthy (1) or unhealthy (0)
# TYPE soroban_rpc_health_status gauge
soroban_rpc_health_status 1

# HELP soroban_rpc_ledger_sequence Current ledger sequence number
# TYPE soroban_rpc_ledger_sequence gauge
soroban_rpc_ledger_sequence 12345

# HELP soroban_rpc_latency_ms Response latency in milliseconds
# TYPE soroban_rpc_latency_ms gauge
soroban_rpc_latency_ms 45

# HELP soroban_rpc_stalled_total Total number of stalled ledger alerts
# TYPE soroban_rpc_stalled_total counter
soroban_rpc_stalled_total 0

# HELP soroban_rpc_latency_spike_total Total number of latency spike alerts
# TYPE soroban_rpc_latency_spike_total counter
soroban_rpc_latency_spike_total 0
```

A `/health` endpoint is also available, returning `{"status":"ok"}`.

## Prometheus Scraping Configuration

Add the following to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'soroban-rpc-health'
    scrape_interval: 10s
    static_configs:
      - targets:
          - 'localhost:9090'
        labels:
          rpc_node: 'testnet'
```

For monitoring multiple RPC nodes, run separate daemon instances on different ports:

```yaml
scrape_configs:
  - job_name: 'soroban-rpc-health'
    scrape_interval: 10s
    static_configs:
      - targets:
          - 'localhost:9090'
          - 'localhost:9091'
          - 'localhost:9092'
        labels:
          cluster: 'soroban'
```

## Running Tests

```bash
npm test
```

## Building

```bash
npm run build
```

Output is written to `./dist`.

## Architecture

```
src/
  index.ts            CLI entry point (commander)
  health-checker.ts   Health check logic, ledger tracking, latency measurement
  alerter.ts          Prometheus metrics, HTTP metrics server, console alerts
  health-checker.test.ts  Tests for health checker
  alerter.test.ts         Tests for alerter and metrics server
```

Only Node.js built-in modules (`http`, `https`, `url`) and `commander` are used. No external HTTP client dependencies.
