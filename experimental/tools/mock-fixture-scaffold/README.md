# mock-fixture-scaffold

CLI that scaffolds a standardized `test.rs` fixture for a Soroban contract crate: a `soroban_sdk::Env`, a mock admin/player set, a Stellar asset contract token, and initial token mints — the boilerplate every contract's test file starts with.

## Usage

```bash
npx tsx src/index.ts --contract <name> --template <single-player|multi-player|staking> --out <dir>
```

### Options

| Flag | Description | Default |
|---|---|---|
| `--contract <name>` | Contract name, kebab-case (e.g. `badge-evolution`). Required. | — |
| `--template <type>` | `single-player`, `multi-player`, or `staking`. | `single-player` |
| `--out <dir>` | Output directory for the generated `test.rs`. | `./src` |
| `--force` | Overwrite an existing `test.rs` if present. | `false` |

### Examples

```bash
# Single-player fixture for a new "badge-evolution" contract
npx tsx src/index.ts --contract badge-evolution --template single-player --out ../../contracts/badge-evolution/src

# Multi-player fixture, overwriting an existing test.rs
npx tsx src/index.ts --contract trivia-duel --template multi-player --out ../../contracts/trivia-duel/src --force
```

## Templates

- **single-player** — one admin, one funded player.
- **multi-player** — one admin, three funded players (for turn-based/PvP contracts).
- **staking** — one admin, one funded staker, and a mock oracle address (for contracts that consult a price feed or randomness source).

All templates use `env.register_stellar_asset_contract_v2` + `token::StellarAssetClient::mint` to fund test accounts, and `env.mock_all_auths()` so generated tests don't need real signatures — matching the pattern used across `experimental/contracts/*/src/test.rs`.

## Generated output

The generated file assumes your contract exposes `<PascalCaseName>Contract` and `<PascalCaseName>ContractClient` (the convention every contract in this workspace follows, e.g. `CoinflipStreakContract`/`CoinflipStreakContractClient`). It scaffolds the `setup()` helper and one smoke test verifying the fixture wired up correctly — you'll extend it with assertions against your contract's actual entrypoints.

## Overwrite protection

By default, the tool refuses to overwrite an existing `test.rs` at the target path and exits with a non-zero status. Pass `--force` to overwrite intentionally.

## Development

```bash
npm install
npm test    # run vitest unit tests
npm run build
```
