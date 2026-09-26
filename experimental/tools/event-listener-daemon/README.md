# event-listener-daemon

Standalone Node.js background service that polls Soroban's `getEvents` RPC
method for a set of contract IDs and forwards matching events to a
configured HTTP webhook, signed with HMAC-SHA256.

Self-contained in `experimental/tools/event-listener-daemon/` — it does not
modify any core backend service.

## Configuration (environment variables)

| Variable | Description |
|---|---|
| `RPC_URL` | Soroban RPC endpoint |
| `CONTRACT_IDS` | Comma-separated list of contract IDs to watch |
| `WEBHOOK_URL` | HTTP(S) endpoint to receive event payloads |
| `WEBHOOK_SECRET` | Shared secret used to HMAC-sign payloads |
| `POLL_INTERVAL_MS` | Polling interval in milliseconds (default `5000`) |
| `CURSOR_FILE` | Path to persist the last processed ledger (default `./cursor.json`) |
| `MAX_RETRIES` | Max webhook delivery retries per event (default `5`) |

## Usage

```bash
npm install
npm run build

RPC_URL=https://soroban-testnet.stellar.org \
CONTRACT_IDS=CABCDEF... \
WEBHOOK_URL=https://example.com/hooks/contract-events \
WEBHOOK_SECRET=change-me \
npm start
```

Stop the daemon with `Ctrl+C` (`SIGINT`) or `SIGTERM`; it finishes the
in-flight poll/dispatch cycle before exiting.

## Design

- **Polling**: each cycle calls `getEvents` starting at the last persisted
  ledger + 1, ensuring zero skipped ledgers across restarts or RPC hiccups —
  the cursor only ever advances to `max(latestLedger + 1, previousCursor)`.
- **Cursor persistence**: the last processed ledger is written to
  `CURSOR_FILE` (JSON) after every successful cycle.
- **Webhook signing**: each event payload is signed with
  `HMAC-SHA256(secret, JSON.stringify(event))`, sent as the
  `x-webhook-signature` header.
- **Retry queue**: failed deliveries (non-2xx, e.g. 500) are retried with
  exponential backoff (`500ms * 2^attempt`, capped at 30s) up to
  `MAX_RETRIES` times.
- **Graceful shutdown**: `SIGINT`/`SIGTERM` set a stop flag checked between
  poll cycles, so an in-progress cycle always completes and persists its
  cursor before the process exits.

## Development

```bash
npm run dev
npm test
```
