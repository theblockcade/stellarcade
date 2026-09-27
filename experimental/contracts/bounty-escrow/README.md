# bounty-escrow (experimental)

An isolated Soroban smart contract implementing community arcade bounties and speedrun challenge escrows. Sponsors fund prize pools for arcade game achievements, players submit game session completion proof hashes, and designated verifiers (oracles or sponsors) release tiered or full prize pool payouts. If a bounty remains unclaimed after the expiration deadline, the original sponsor can reclaim the locked funds in full.

This contract lives entirely under `experimental/contracts/bounty-escrow/` and does not alter production contracts.

## Interface

```rust
initialize(env: Env, oracle: Address, token: Address) -> Result<(), Error>

post_bounty(env: Env, sponsor: Address, target_game: Symbol, target_score: u64, amount: i128, deadline: u64) -> Result<u64, Error>

submit_claim(env: Env, player: Address, bounty_id: u64, proof_hash: BytesN<32>) -> Result<(), Error>

approve_bounty(env: Env, verifier: Address, bounty_id: u64) -> Result<i128, Error>

approve_partial_bounty(env: Env, verifier: Address, bounty_id: u64, payout_amount: i128) -> Result<i128, Error>

refund_bounty(env: Env, sponsor: Address, bounty_id: u64) -> Result<i128, Error>

reclaim_expired(env: Env, sponsor: Address, bounty_id: u64) -> Result<i128, Error>

get_bounty(env: Env, bounty_id: u64) -> Result<Bounty, Error>

get_claim(env: Env, bounty_id: u64) -> Result<Claim, Error>

get_oracle(env: Env) -> Result<Address, Error>

get_token(env: Env) -> Result<Address, Error>
```

## Lifecycle Flow

1. **Contract Initialization:**
   `initialize` configures the designated oracle verifier and token asset address.

2. **Bounty Creation:**
   A sponsor calls `post_bounty` with target arcade game, target score, reward amount, and expiration timestamp. Prize tokens are transferred from the sponsor into escrow.

3. **Claim Submission:**
   A player who achieved the objective submits a cryptographic proof hash (such as the hash of a speedrun recording or gameplay session log) via `submit_claim` before the expiration deadline.

4. **Claim Verification and Payout:**
   The designated oracle or the bounty sponsor inspects the proof and calls `approve_bounty` to release the full prize to the player, or `approve_partial_bounty` for tiered milestone objectives.

5. **Expiration and Refund:**
   If a bounty passes its expiration deadline without an approved payout, the sponsor calls `refund_bounty` (or `reclaim_expired`) to retrieve unallocated prize tokens. Once refunded, claims can no longer be approved.

## Authorization Model

- `sponsor.require_auth()` is enforced on `post_bounty` and `refund_bounty`.
- `player.require_auth()` is enforced on `submit_claim`.
- `verifier.require_auth()` is enforced on `approve_bounty` and `approve_partial_bounty`. Only the designated oracle address or the original bounty sponsor can verify and release funds.
- Strict state checks prevent approvals after a sponsor has reclaimed expired funds or after a bounty has already completed.

## Storage Architecture

- `instance()`:
  - `Initialized`: Contract initialization guard.
  - `Oracle`: Address of the designated oracle verifier.
  - `Token`: Address of the SEP-41 token asset.
  - `NextBountyId`: Auto-incrementing identifier counter for new bounties.

- `persistent()` (bumped on write with `PERSISTENT_BUMP_LEDGERS`):
  - `Bounty(bounty_id)`: Stores `Bounty` record containing target game, target score, amounts, deadline, and status.
  - `Claim(bounty_id)`: Stores `Claim` record containing player address, proof hash, timestamp, and approval state.

## Building and Testing

Run test suite:

```bash
cargo test --manifest-path experimental/contracts/bounty-escrow/Cargo.toml
```

Build Wasm binary:

```bash
cargo build --manifest-path experimental/contracts/bounty-escrow/Cargo.toml --target wasm32-unknown-unknown --release
```
