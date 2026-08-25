# Event Webhook Broadcaster

A lightweight Node.js/TypeScript service that reads Soroban arcade contract events and broadcasts high-value ones (jackpot wins, tournament finals, big streaks) to Discord and Telegram as rich formatted messages.

## Features

- **Event Filtering**: Only events meeting `MIN_BROADCAST_WAGER` are dispatched — routine low-stakes events never hit the webhook
- **Rich Discord Embeds**: Title, color-coded by event type, key/value fields, and a link to the contract on Stellar Expert
- **Telegram HTML Messages**: Bold title, inline-code addresses, HTML-escaped user-controlled fields
- **Independent Multi-Target Dispatch**: Discord and Telegram are dispatched concurrently; a failure or timeout on one never blocks or drops the other
- **Rate-Limit Backoff**: Retries on HTTP 429 with exponential backoff, honoring the `Retry-After` header when present (up to 4 attempts)
- **Env-Only Credentials**: Webhook URL and bot token are read strictly from environment variables, never CLI flags, so they never appear in `ps` or shell history

## Installation

```bash
cd experimental/tools/event-webhook-broadcaster
npm install
npm run build
```

## Usage

```bash
# Config via environment variables
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
export TELEGRAM_BOT_TOKEN="123456:ABC-DEF..."
export TELEGRAM_CHAT_ID="-1001234567890"
export MIN_BROADCAST_WAGER="100"

# Reads a newline-delimited JSON event feed (a stand-in for a live contract
# event subscription) and broadcasts qualifying events
node dist/index.js events.ndjson
```

Each line of the feed file is a JSON-encoded `GameEvent`:

```json
{"type":"jackpot_won","timestamp":"2026-08-24T12:00:00.000Z","contractId":"CABC...","player":"GABC...","wagerXlm":500}
```

## Configuration

| Env var | Required | Description |
|---|---|---|
| `DISCORD_WEBHOOK_URL` | one of Discord/Telegram | Discord incoming webhook URL |
| `TELEGRAM_BOT_TOKEN` | one of Discord/Telegram | Telegram bot API token |
| `TELEGRAM_CHAT_ID` | with `TELEGRAM_BOT_TOKEN` | Target chat/channel id |
| `MIN_BROADCAST_WAGER` | no (default `100`) | Minimum wager/win amount in XLM required to broadcast an event |

## API

```ts
import { broadcastEvent } from './broadcaster';

const status = await broadcastEvent(event, {
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramChatId: process.env.TELEGRAM_CHAT_ID,
  minBroadcastWager: 100,
});
```

`broadcastEvent(event, config): Promise<BroadcastStatus>` — dispatches to every configured target and returns a per-target result (`ok`, `status`, `attempts`, `error`). Events below the wager threshold are skipped with `skipped: true` and no network call is made.

## Testing

```bash
npm test
```

Tests spin up local mock HTTP servers (no real network calls) to verify Discord/Telegram payload formatting and the 429 retry-backoff handler.

## License

MIT
