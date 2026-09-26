# seed-verifier-cli

Offline command-line verifier for StellarCade's provably-fair rounds. Lets a
player independently recompute a round's outcome from raw seed parameters,
with no browser or backend dependency.

## Scheme

- **Commitment**: `SHA-256(serverSeed)`, published before a round is played.
- **Round hash**: `HMAC-SHA256(key = serverSeed, message = "{clientSeed}:{nonce}")`.
- **Outcome mapping** (from the first 8 hex chars of the round hash, read as an
  unsigned 32-bit integer):
  - `coinflip`: even → `heads`, odd → `tails`
  - `dice`: `(value % 100) + 1` → `1-100`
  - `roulette`: `value % 37` → `0-36`

This mirrors the deterministic seed/nonce scheme used by the `random-generator`
contract so a revealed server seed can be checked against on-chain results.

## Usage

```bash
npm install
npm run build

# Verify a single round
seed-verifier-cli verify \
  --server-seed <revealed-seed> \
  --client-seed <client-seed> \
  --nonce 42 \
  --game coinflip \
  --commitment <sha256-hex> \
  --expected heads

# Verify a batch of rounds from a JSON log
seed-verifier-cli batch rounds.json
```

`rounds.json` is an array of entries:

```json
[
  { "serverSeed": "...", "clientSeed": "...", "nonce": 0, "game": "dice", "expectedResult": 42 }
]
```

## Exit codes

- `0` — all rounds verified successfully
- `1` — one or more rounds failed verification (result or commitment mismatch)
- `2` — invalid CLI usage (bad args, missing/invalid file)

## Development

```bash
npm run dev -- verify --server-seed a --client-seed b --nonce 0 --game coinflip
npm test
```
