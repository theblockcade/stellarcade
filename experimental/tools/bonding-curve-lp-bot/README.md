# Bonding Curve LP Bot

An automated liquidity provider bot that places periodic buy/sell orders
against a dynamic bonding curve pool, using a configurable random-walk
strategy that leans toward whichever side pushes the pool's reserve ratio
back toward a target, while enforcing budget and emergency-reserve
guardrails.

## Features

- **Configurable Trading Wallet**: Reads `BOT_SECRET_KEY`, `CONTRACT_ID`,
  `RPC_URL`, `TRADE_INTERVAL_MS`, and `MAX_POSITION_XLM` from the
  environment, per the issue's config spec
- **Random Walk Strategy**: Balanced buy/sell volume by default
  (`DRIFT_BIAS=0.5`), with a configurable drift toward one side
- **Reserve-Ratio-Aware Intensity**: When the pool's `xlmReserve /
  tokenReserve` ratio deviates from its configured target, the strategy
  leans toward trades that correct it, per the "adjust buy/sell intensity
  when reserve ratio deviates from target" requirement
- **Trade Logging**: Every executed trade logs its transaction hash, gas
  spent (stroops), and realized slippage
- **Emergency Reserve Guardrail**: Halts trading (non-zero exit) if wallet
  balance falls below `EMERGENCY_RESERVE_XLM`
- **Max Position Guardrail**: Skips (rather than executes) any trade that
  would push the bot's open position past `MAX_POSITION_XLM`
- **Graceful Shutdown**: `SIGINT`/`SIGTERM` finish the current cycle, then
  print a trade summary report (trades executed, volume, gas, avg
  slippage) before exiting

## Installation

```bash
npm install
npm run build
```

## Usage

Configuration is via environment variables, per the issue spec:

| Variable              | Required | Default                              | Description                                   |
|------------------------|----------|---------------------------------------|------------------------------------------------|
| `BOT_SECRET_KEY`       | yes*     | —                                      | Stellar secret key (`S...`) for the trading wallet |
| `CONTRACT_ID`          | yes*     | —                                      | Bonding curve contract id to trade against     |
| `RPC_URL`              | yes*     | —                                      | Soroban RPC endpoint                           |
| `TRADE_INTERVAL_MS`    | no       | `5000`                                 | Milliseconds between trade attempts            |
| `MAX_POSITION_XLM`     | no       | `1000`                                 | Max open position (XLM notional) before skipping trades |
| `EMERGENCY_RESERVE_XLM`| no       | `5`                                     | Halts trading if wallet balance drops below this |
| `DRIFT_BIAS`           | no       | `0.5`                                   | Buy probability bias (0 = always sell, 1 = always buy) |
| `MIN_TRADE_XLM` / `MAX_TRADE_XLM` | no | `1` / `25`                    | Trade size range, in XLM notional              |
| `SEED`                 | no       | current time                            | PRNG seed for reproducible trade sequences     |

\* Not required when running with `--dry-run` (see below).

```bash
# Dry run against the built-in simulated bonding curve pool — no live
# credentials required. Runs 20 trade cycles and prints a summary.
node dist/index.js --dry-run --cycles 20

# Reproducible dry run
SEED=42 node dist/index.js --dry-run --cycles 20

# JSON summary output instead of formatted text
node dist/index.js --dry-run --cycles 20 --json-summary
```

**CLI Options:**
- `--dry-run`: Run against an in-memory simulated pool instead of requiring
  live credentials (see Known Limitations — this is currently the only
  supported execution mode)
- `--cycles <n>`: Number of trade cycles to run before stopping (omit for
  continuous operation until `SIGINT`/`SIGTERM`)
- `--json-summary`: Print the final run summary as JSON

### Sample output

```
💧 Bonding Curve LP Bot
  Contract:       DRY_RUN_CONTRACT
  RPC:            https://soroban-testnet.stellar.org
  Trade interval: 5000ms
  Max position:   1000 XLM
  Emergency reserve: 5 XLM
  Mode:           dry-run (simulated pool)

BUY  8.42 XLM | tx=SIM_000001_a1b2c3d4 | gas=312stroops | slippage=0.017% | random walk (drift bias 0.50)
SELL 3.10 XLM | tx=SIM_000002_e5f6a7b8 | gas=284stroops | slippage=0.006% | random walk (drift bias 0.50)
...

Run Summary
  Trades executed: 20 (11 buys, 9 sells)
  Total volume:    241.35 XLM
  Total gas:       6104 stroops
  Avg slippage:    0.021%
  Duration:        0.0s
```

### Testing

```bash
npm test
```

## Strategy Model

`src/strategy.ts` is a pure, seed-reproducible module (mulberry32 PRNG, the
same convention used by `experimental/tools/contract-fuzz-runner`):

1. Compute the pool's ratio deviation from `targetRatio`.
2. Blend `DRIFT_BIAS` with a clamped deviation-correction signal to get a
   buy probability.
3. Pick a side, then a uniformly random trade size in
   `[MIN_TRADE_XLM, MAX_TRADE_XLM]`.

`src/bot.ts` (`LiquidityBot`) drives the loop: check the emergency reserve,
get a decision from the strategy, enforce the max-position guardrail,
execute, log, sleep `TRADE_INTERVAL_MS`, repeat.

## Known Limitations / Follow-ups

- **No live executor yet.** The bot only runs in `--dry-run` mode against
  `SimulatedExecutor`, an in-memory constant-product (`x * y = k`) pool
  model. There is no bonding curve contract in this repo's `contracts/*`
  workspace to bind against today, and this MVP does not fabricate a
  connection to `@stellar/stellar-sdk`/Soroban RPC that hasn't been
  verified to work. Wiring a real `TradeExecutor` (submitting an actual
  swap/trade invocation, signing with `BOT_SECRET_KEY`, and reading real
  ledger state back for `getPoolState`/`getWalletBalanceXlm`) is the
  natural next step once a target contract's actual interface is known —
  see the `TradeExecutor` interface in `src/types.ts`, which the real
  implementation would satisfy without changing `bot.ts` or `strategy.ts`.
- **Constant-product curve, not a bespoke "dynamic" curve.** The
  simulated pool uses the standard `x * y = k` AMM formula as a
  reasonable stand-in for "a bonding curve" in the absence of a specific
  contract to match; a real dynamic bonding curve contract may use a
  different pricing function (e.g. a sigmoid or piecewise curve), which
  would change the executor's math but not the bot's control loop.
- **`--cycles` is required for a bounded dry run.** Without it the bot
  runs until `SIGINT`/`SIGTERM`; this is intentional (mirrors how the real
  bot is meant to run continuously) but means an unattended `--dry-run`
  without `--cycles` will not terminate on its own.

## License

MIT
