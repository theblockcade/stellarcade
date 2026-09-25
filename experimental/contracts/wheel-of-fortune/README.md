# Wheel of Fortune (experimental)

An isolated Soroban smart contract implementing an 8-segment prize
multiplier wheel with token escrow, commit-reveal random spin resolution,
and automatic payout distribution.

This contract lives in `experimental/contracts/` — it is a standalone crate
that is self-contained and does not depend on, or modify, anything outside
`experimental/contracts/wheel-of-fortune/`.

## Overview

Players wager tokens on a spin of an 8-segment wheel. Each segment carries a
payout multiplier:

| Segment | Multiplier |
|---|---|
| 0 | 0x (bust — wager is lost to the house) |
| 1 | 0.5x |
| 2 | 1x (wager returned) |
| 3 | 1.5x |
| 4 | 2x |
| 5 | 3x |
| 6 | 5x |
| 7 | 10x |

Multipliers are stored on-chain as basis-100 integers (`50` == `0.5x`,
`1000` == `10x`) to avoid floating point.

## Provably Fair Randomness (Commit-Reveal)

1. **Commit** — when a player calls `spin_wheel`, they submit a
   `client_seed: BytesN<32>` of their own choosing. This value, together
   with the spin's `nonce` (the spin's own id), is locked into the on-chain
   `SpinRecord` *before* any outcome is known to either party.
2. **Reveal** — the admin/oracle later calls `settle_spin` with a
   `server_secret: BytesN<32>`. The final outcome is derived deterministically as:

   ```text
   segment_index = sha256(server_secret || client_seed || nonce_be_bytes) % 8
   ```

   Because the client's contribution was committed first and the server's
   secret is revealed only once (and is expected to be pre-committed to
   off-chain, e.g. published as a hash ahead of time), neither side can bias
   the outcome after the fact. Anyone can independently recompute
   `segment_index` from the public `SpinRecord` and the revealed
   `server_secret` to verify fairness.

## Interface

```rust
fn initialize(env: Env, admin: Address, token: Address, min_wager: i128, max_wager: i128) -> Result<(), Error>;

fn spin_wheel(env: Env, player: Address, wager_amount: i128, client_seed: BytesN<32>) -> Result<u64, Error>;

fn settle_spin(env: Env, spin_id: u64, server_secret: BytesN<32>) -> Result<i128, Error>;

fn get_spin_info(env: Env, spin_id: u64) -> Result<SpinRecord, Error>;

fn get_wheel_segments(env: Env) -> Vec<u32>;

fn fund_house(env: Env, admin: Address, amount: i128) -> Result<(), Error>;
fn withdraw_house(env: Env, admin: Address, amount: i128) -> Result<(), Error>;
fn house_reserve(env: Env) -> i128;
fn escrow_total(env: Env) -> i128;

fn pause(env: Env, admin: Address) -> Result<(), Error>;
fn unpause(env: Env, admin: Address) -> Result<(), Error>;
fn is_paused(env: Env) -> bool;
```

### `initialize`
One-time setup. Sets the admin, the SEP-41 token used for wagers/payouts,
and the `[min_wager, max_wager]` bounds. Requires `admin.require_auth()`.

### `spin_wheel`
Player-authorized call (`player.require_auth()`). Validates the wager is
within bounds, checks the house reserve can cover the profit portion of the
maximum possible payout (10x wager), transfers `wager_amount` tokens from
the player into contract escrow, and stores a new `Pending` `SpinRecord`
keyed by a fresh `spin_id` (which also serves as the round nonce). Rejected
while the contract is paused.

### `settle_spin`
Admin-authorized call (`admin.require_auth()`). Reveals `server_secret`,
derives the winning segment, computes `payout = wager * multiplier / 100`,
releases the wager from escrow, updates the house reserve (absorbing the
loss on a win, retaining the difference on a loss/bust), transfers the
payout to the player (if non-zero), and marks the spin `Settled`. Rejects
spins that are already settled.

### `get_spin_info`
Read-only lookup of a spin's full record, including status, resolved
segment, multiplier, and payout.

### `get_wheel_segments`
Read-only list of the 8 segment multipliers, in basis-100 units.

### House reserve & bankroll safety
`fund_house` / `withdraw_house` let the admin manage a bankroll separate
from player escrow. `spin_wheel` refuses any wager whose maximum possible
payout (10x) the current house reserve could not cover, so the house can
never accept a bet it might not be able to honor.

### Emergency pause
`pause` / `unpause` (admin-only) stop `spin_wheel` and `settle_spin` from
proceeding, for incident response.

## Storage Layout

- `instance()`: `Admin`, `Token`, `MinWager`, `MaxWager`, `Paused`,
  `SpinNonce`, `EscrowTotal`, `HouseReserve` — small, fixed-size contract
  config and counters, one ledger entry, single TTL.
- `persistent()`: `Spin(spin_id) -> SpinRecord`, one entry per spin,
  TTL-bumped on every write.

## Testing

```bash
cargo test --manifest-path experimental/contracts/wheel-of-fortune/Cargo.toml
```

Tests cover: spin placement and escrow lock, winning-spin payout transfer,
losing (0x) spin retention by the house, wager bound rejections (too low,
too high, zero/negative), insufficient-bankroll rejection, pause/unpause
gating, and double-settlement rejection.

To build the WASM binary:

```bash
cargo build --manifest-path experimental/contracts/wheel-of-fortune/Cargo.toml \
  --target wasm32-unknown-unknown --release
```
