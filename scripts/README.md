# Stellarcade Scripts & Deployment Guide

This directory contains automation scripts to configure testnet identities, deploy contracts, initialize parameters, and wire up the Stellarcade contract stack on Stellar testnet.

## Prerequisites

- [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/stellar-cli):
  ```bash
  cargo install --locked stellar-cli --features opt
  ```
- Rust and `wasm32-unknown-unknown` target:
  ```bash
  rustup target add wasm32-unknown-unknown
  ```

---

## 1. Setup Testnet Identities

Run `setup-testnet.sh` to configure and fund the three required identities (`admin`, `oracle`, `player1`) on Stellar Testnet:

```bash
./scripts/setup-testnet.sh
```

- If an identity already exists in `stellar keys ls`, it is preserved and skipped.
- New identities are generated and funded automatically via Friendbot.

---

## 2. Deploy and Wire Contracts

Deploy, initialize, and wire the `random-generator` and `coin-flip` smart contracts:

```bash
./scripts/deploy-contracts.sh --network testnet --source admin --build
```

### What this script does:
1. **Compiles Contracts**: Builds `random_generator.wasm` and `coin_flip.wasm` inside `contracts/`.
2. **Deploys `random-generator`**: Instantiates the contract and initializes it with `(admin, oracle)`.
3. **Resolves XLM SAC**: Looks up the native XLM Stellar Asset Contract ID on the target network.
4. **Deploys `coin-flip`**: Instantiates the contract and initializes it with `(admin, rng_contract, token, min_wager, max_wager, house_edge_bps)`.
5. **Authorizes Caller**: Adds `coin-flip` as an authorized caller on `random-generator`.
6. **Funds House Bankroll**: Deposits the specified initial bankroll from `admin` into `coin-flip`.
7. **Pre-commits Seeds**: Pre-commits an initial batch of SHA-256 seed commitments to the RNG commitment queue from `oracle`.
8. **Writes Deployment Manifest**: Generates `deployments/testnet.json` with the deployed addresses and network metadata.
9. **Outputs Env Variables**: Prints ready-to-copy configuration lines for `apps/web/.env.local` and `backend/.env`.

---

## 3. Command Options & Flags

| Flag | Default | Description |
|---|---|---|
| `--network <name>` | `testnet` | Target Stellar network |
| `--source <name>` | `admin` | Signer/admin identity for deploying and funding |
| `--build` | `false` | Build WASM artifacts via cargo before deploying |
| `--fresh` | `false` | Force a fresh deployment instead of reusing existing deployment in `deployments/testnet.json` |
| `--dry-run` | `false` | Validate CLI, identities, and WASM artifacts without executing on-chain transactions |
| `--min-wager <amount>` | `10000000` | Minimum wager allowed in stroops (1 XLM) |
| `--max-wager <amount>` | `1000000000` | Maximum wager allowed in stroops (100 XLM) |
| `--bankroll <amount>` | `10000000000` | Initial house bankroll in stroops (1,000 XLM) |

---

## 4. Re-running Deployments

By default, executing `./scripts/deploy-contracts.sh` will check `deployments/testnet.json`. If valid contract deployments exist, the script outputs the existing contract IDs idempotently without creating redundant contracts.

To force a redeployment from scratch:
```bash
./scripts/deploy-contracts.sh --network testnet --source admin --fresh --build
```
