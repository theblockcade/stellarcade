# Tournament Simulator

An end-to-end tournament simulation runner: registers mock players, simulates single-elimination bracket rounds with randomized match scores, and verifies champion/runner-up prize disbursement against the total prize pool.

## What it does

1. Registers `--size` mock players (must be a power of two: 4, 8, 16, 32, ...) with generated addresses.
2. Plays every round of a single-elimination bracket, pairing adjacent survivors and simulating a randomized score for each match (re-rolled on a tie, so every match has a clear winner — no draw state to resolve).
3. Disburses the prize pool (`size × wager`, minus the protocol fee) 70/30 between the champion and runner-up.
4. Runs an accounting verification pass: confirms `disbursed + fee == prizePool` exactly (flags trapped funds otherwise) and that every registered player appeared in at least one match (flags unmatched players otherwise).
5. Prints a full step-by-step transcript plus a summary report — or the same data as structured JSON with `--json`.

## Known Limitations

This simulator is fully self-contained — no real Soroban RPC calls, no live contract, no funded wallets required — so it can generate load-shape data and exercise the bracket/payout logic without a deployed tournament contract running. `--rpc-url` is accepted on the CLI for interface parity with the issue's spec, but is currently unused. Registration, round submission, and disbursement "transactions" are simulated (a pseudo-random 64-hex-char string standing in for a real tx hash), not sent to any network. A production integration would swap `registerPlayers`/`playRound`'s tx-hash generation in `simulator.ts` for real `create_tournament`/`submit_score`/`claim_prize` contract calls, following the same pattern `experimental/tools/bonding-curve-lp-bot`'s `SimulatedExecutor` uses for its default, network-free mode.

## Installation

```bash
cd experimental/tools/tournament-simulator
npm install
```

## Usage

```bash
npx tsx src/index.ts run --size 8 --wager 100 [--fee-bps 500] [--seed <n>] [--json]
```

| Flag | Default | Description |
|---|---|---|
| `--size <n>` | `8` | Number of players; must be a power of two (4, 8, 16, 32, ...) |
| `--wager <amount>` | `100` | Wager amount per player |
| `--fee-bps <bps>` | `500` | Protocol fee, in basis points, taken from the prize pool |
| `--seed <n>` | random | PRNG seed — pass the same seed to reproduce an identical bracket |
| `--rpc-url <url>` | — | Accepted for interface parity; unused (see Known Limitations) |
| `--json` | `false` | Print the structured summary as JSON instead of the formatted transcript |

Exit code is `1` if verification finds any issues (trapped funds or unmatched players); `0` on a clean run.

## Sample run

```
$ npx tsx src/index.ts run --size 8 --wager 100 --seed 123

🏆 Tournament Simulator
Size: 8 | Wager: 100 | Fee: 500bps

Registered 8 players.
  player_1 -> GC2736DDEC69F30958938A2018D49EBF196D783E93457DF75159087C (registration tx pending)
  ...

Prize pool: 800 (8 x 100 wager).

Round 1 (8 players):
  r1_m1: player_1 (99) vs player_2 (19) -> winner player_1 [tx 50b3c796ba56...]
  r1_m2: player_3 (21) vs player_4 (75) -> winner player_4 [tx fc701d1d20b0...]
  r1_m3: player_5 (16) vs player_6 (97) -> winner player_6 [tx 860497cb3a90...]
  r1_m4: player_7 (74) vs player_8 (30) -> winner player_7 [tx 64e271477e8c...]

Round 2 (4 players):
  r2_m1: player_1 (18) vs player_4 (62) -> winner player_4 [tx a8e380a4543c...]
  r2_m2: player_6 (97) vs player_7 (32) -> winner player_6 [tx 2bb44cfc3cbf...]

Round 3 (2 players):
  r3_m1: player_4 (97) vs player_6 (51) -> winner player_4 [tx 323f87ebcf29...]

Final: champion player_4, runner-up player_6.
Prize pool 800 - fee 40 = 760 distributable (champion 532, runner-up 228).

Verification: PASSED — no trapped funds, no unmatched players.

Summary Report
  Rounds played:     3
  Total matches:     7
  Champion:          player_4 (+532)
  Runner-up:         player_6 (+228)
  Protocol fee:      40
  Verification:      PASSED
```

## Running tests

```bash
npm test
```

20 tests covering bracket progression (round/match counts for sizes 4/8/16, winner propagation between rounds, deterministic seeding), input validation (rejects non-power-of-two sizes and non-positive wagers), and prize disbursement verification (champion/runner-up identification, fee math, full accounting with no trapped funds, no unmatched players) across every supported bracket size.
