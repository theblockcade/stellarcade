# Account Hygiene Checker CLI

A Node.js/TypeScript CLI that inspects a batch of Stellar addresses for
account "hygiene": minimum reserve health, spendable balance for
transaction fees, and required asset trustlines. Built for developers and
automated bot runners who need a quick health signal for a list of test
accounts before running scenarios against them.

## Features

- **Reserve Math**: Computes each account's minimum required balance as
  `(2 + subentries) * baseReserve` and derives spendable balance from it
- **Fee Headroom Check**: Flags accounts with less than 2 XLM of spendable
  balance as a warning (they may fail to pay transaction fees soon)
- **Trustline Hygiene**: Flags accounts missing one or more required asset
  trustlines (e.g. a game token or USDC) as a danger
- **Unactivated Account Detection**: A 404 from Horizon (account never
  funded) is reported as `danger` rather than crashing the batch
- **Auto-Funding**: `--auto-fund` requests testnet funding via Friendbot for
  any unactivated account, then re-checks it
- **Colored CLI Table**: Healthy / Warning / Danger status per account, plus
  a rolled-up summary line

## Installation

```bash
npm install
npm run build
```

## Usage

```bash
node dist/index.js --addresses <path-to-json-or-csv> [--auto-fund] [--network testnet|mainnet]
```

**Options:**
- `--addresses <path>` (required): Path to a JSON array (`["G...", "G..."]`)
  or a newline/comma-delimited plain text file of addresses
- `--auto-fund`: Fund unactivated accounts via Friendbot and re-verify
  (testnet only — Friendbot does not fund mainnet accounts)
- `--network <testnet|mainnet>`: Which Horizon network to query (default `testnet`)
- `--required-trustline <code:issuer>`: A required asset trustline, as
  `CODE:ISSUER`. Repeatable for multiple required assets.
- `--json`: Output raw JSON instead of the formatted table

The process exits with a non-zero code if any checked account ends up in
`danger` status, so it can be used as a gate in scripts/CI.

### Examples

```bash
# Basic health check against testnet
node dist/index.js --addresses ./accounts.json

# Require a game token trustline and auto-fund any unfunded accounts
node dist/index.js \
  --addresses ./accounts.json \
  --auto-fund \
  --required-trustline GAME:GCKFBEIYTKP74Q4KSVXVLGVSTOKQ5H55DBTZ6VXJDMBFXVEJHWNP2E7X

# Mainnet check, JSON output
node dist/index.js --addresses ./accounts.json --network mainnet --json
```

### Addresses File Format

JSON array:

```json
["GABC...", "GDEF...", "GHIJ..."]
```

or newline/CSV plain text:

```
GABC...
GDEF...,GHIJ...
```

### Testing

```bash
npm test
```

## Reserve Model

- Minimum reserve is computed as `(2 + subentries) * baseReserve`, with
  `baseReserve` defaulting to 0.5 XLM (the current Stellar network default —
  see `BASE_RESERVE_XLM` in `src/rules.ts`). Each trustline, offer, data
  entry, or extra signer counts as one subentry.
- **Spendable balance** is `nativeBalance - minReserve`. An account whose
  spendable balance drops below 0 cannot pay for anything and is `danger`.
- An account with a non-negative spendable balance below 2 XLM is `warning`
  (it may soon be unable to cover transaction fees); a missing required
  trustline always escalates the status to `danger` regardless of balance.

## Known Limitations / Follow-ups

- `--network mainnet` queries the public Horizon instance
  (`https://horizon.stellar.org`) directly; be mindful of rate limits when
  checking large address lists.
- Friendbot funding (`--auto-fund`) is sequential per address to stay under
  Friendbot's rate limits, so very large unfunded batches will take longer
  than a parallel implementation. That tradeoff is intentional for a CLI
  hygiene tool rather than a high-throughput funder.
- `baseReserve` (0.5 XLM) and the 2 XLM fee-headroom threshold are exposed
  as named constants (`src/rules.ts`, `src/types.ts`) in case the network's
  base reserve setting ever changes.

## License

MIT
