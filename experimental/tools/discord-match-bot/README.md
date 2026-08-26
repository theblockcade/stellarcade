# Discord Match Bot

A lightweight Node.js/TypeScript service that listens for StellarCade match settlement events and announces results to a Discord channel as rich, color-coded embeds. Uses Discord webhook HTTP API directly — no discord.js dependency required.

## Features

- **Rich Embed Announcements**: Color-coded by match type — green for high payouts, purple for jackpots, gold for tournament finals, blue for normal matches
- **Wager Threshold Filtering**: Only matches meeting `MIN_ANNOUNCE_WAGER` are posted, keeping channels clean of low-stakes noise
- **Rate-Limit Queue**: Respects Discord's 5-messages-per-5-seconds channel limit with automatic queueing and timing
- **Auto-Reconnect**: Exponential backoff reconnection for WebSocket event stream failures
- **Webhook-Based Posting**: Uses simple HTTP fetch for Discord webhook delivery — no heavy discord.js library
- **CLI Interface**: Commander-based CLI with environment variable configuration

## Installation

```bash
cd experimental/tools/discord-match-bot
npm install
npm run build
```

## Environment Setup

| Env var | Required | Description |
|---|---|---|
| `DISCORD_BOT_TOKEN` | yes | Discord bot authentication token |
| `CHANNEL_ID` | yes | Target Discord channel ID for announcements |
| `BACKEND_WS_URL` | yes | WebSocket URL for match settlement event stream |
| `MIN_ANNOUNCE_WAGER` | no (default `100`) | Minimum wager in XLM required to announce a match |
| `WEBHOOK_URL` | no | Discord webhook URL for direct posting (overrides bot token + channel) |

## Usage

```bash
# Start with environment variables
export DISCORD_BOT_TOKEN="your-bot-token"
export CHANNEL_ID="123456789012345678"
export BACKEND_WS_URL="wss://api.stellarcade.io/ws/matches"
export MIN_ANNOUNCE_WAGER="50"

# Run in production mode
npm start

# Run in development mode (ts-node)
npm run dev

# Override config via CLI flags
npm start -- --min-wager 200 --webhook-url "https://discord.com/api/webhooks/..."
```

## Testing

```bash
npm test
```

Tests use vitest and mock HTTP servers to verify embed formatting, rate-limit queue behavior, and event listener lifecycle — no real network calls are made.

## License

MIT
