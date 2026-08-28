# Coinflip Stress Runner

Multi-round coinflip bot stress test runner for house edge solvency verification.

## Overview

Spawns N concurrent bot players executing coinflip bets against a target contract. Supports multiple betting strategies and tracks global bankroll delta, player win rates, and gas fee expenditures.

## Usage

```bash
npx tsx src/index.ts --rounds 1000 --concurrency 10 --strategy martingale
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--rounds <n>` | Number of rounds per bot | 100 |
| `--concurrency <c>` | Number of concurrent bots | 5 |
| `--strategy <s>` | Betting strategy: `flat`, `martingale`, `fibonacci` | `flat` |
| `--rpc-url <url>` | Soroban RPC URL | testnet |
| `--initial-balance <n>` | Starting balance per bot (in XLM) | 100 |
| `--bet-amount <n>` | Base bet amount (in XLM) | 1 |

### Betting Strategies

- **Flat Bet**: Constant bet amount every round
- **Martingale**: Double bet on loss, reset to base on win
- **Fibonacci**: Follow fibonacci sequence on loss, reset on win

## Output

The runner outputs a statistical summary including:

- Total rounds played across all bots
- Win/loss counts and overall win rate
- Win rate confidence interval (95%)
- House edge verification
- Per-player statistics (wins, losses, streaks, gas spent)
- Bankroll delta tracking

## Example

```bash
# Run 5000 rounds with 20 concurrent bots using martingale strategy
npx tsx src/index.ts --rounds 5000 --concurrency 20 --strategy martingale --initial-balance 1000 --bet-amount 10
```

## Testing

```bash
npx vitest run
```
