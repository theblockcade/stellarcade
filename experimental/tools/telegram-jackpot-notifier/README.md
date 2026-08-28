# Telegram Jackpot Notifier

Telegram bot worker that monitors Stellar Soroban contract events and broadcasts formatted jackpot win alerts to community channels.

## Setup

1. Create a Telegram bot via [@BotFather](https://t.me/BotFather) and get the bot token
2. Add the bot to your Telegram channel/group
3. Get the chat ID (use `@userinfobot` or the Telegram API)

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Yes | Bot token from @BotFather |
| `CHAT_ID` | Yes | Target Telegram chat/channel ID |
| `RPC_URL` | Yes | Soroban RPC endpoint URL |
| `MIN_NOTIFY_AMOUNT` | No | Minimum XLM to trigger notification (default: 100) |
| `POLL_INTERVAL_MS` | No | Polling interval in ms (default: 15000) |

## Usage

```bash
# Dry run (prints sample message, no Telegram API calls)
npx tsx src/index.ts --dry-run

# Live mode
TELEGRAM_BOT_TOKEN=... CHAT_ID=... RPC_URL=... npx tsx src/index.ts
```

## Features

- Polls Soroban RPC for contract events (jackpot wins, big wagers)
- Formats HTML messages with trophy emojis, winner details, and Stellar Expert links
- Token-bucket rate limiter (25 msg/sec, under Telegram's 30/sec limit)
- Exponential backoff retry with jitter on network errors
- Graceful shutdown on SIGINT/SIGTERM
- `--dry-run` mode for testing message formatting

## Sample Output

```
🏆 JACKPOT WIN!

🎮 Coin Flip Ultra
💰 Winner: @arcade_champ (GBZC6B3M...XXYY)
💎 Prize: 1250.50 XLM

🔗 View on Stellar Expert
```

## Architecture

| File | Purpose |
|---|---|
| `types.ts` | Shared TypeScript interfaces |
| `telegram-client.ts` | Message formatting, rate limiter, retry logic, Telegram API send |
| `event-poller.ts` | Soroban RPC event polling loop |
| `index.ts` | CLI entry point with commander |
