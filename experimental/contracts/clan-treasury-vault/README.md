# Clan Treasury Vault

An experimental Soroban contract implementing a multi-signature guild
treasury for Stellarcade clans. Members pool match winnings into a shared
vault, and the clan leader together with a set of officers vote on
disbursement proposals before funds move.

This is an isolated, self-contained experimental contract. It does not
depend on, and is not depended on by, any contract under `contracts/`.

## Design

- **Vault creation** — the clan leader sets the initial officer roster, a
  quorum threshold (e.g. 2-of-3, 3-of-5), and the SEP-41 token used for
  deposits and payouts. The leader is always granted voting power in
  addition to the listed officers.
- **Deposits** — any address (contributor) can add funds to the vault by
  transferring the configured token into the contract.
- **Proposals** — an officer (including the leader) proposes a payout: a
  recipient, an amount, and a short memo.
- **Voting** — officers vote to approve or reject a proposal. Each officer
  may vote exactly once per proposal. Non-officers cannot vote.
- **Timelock** — once a proposal collects enough approvals to reach the
  configured threshold, a fixed timelock window (`EXECUTION_TIMELOCK_LEDGERS`,
  ~1 hour at 5s/ledger) must elapse before it can be executed. This gives
  clan members a window to notice and react to a proposal before funds move.
- **Execution** — once quorum has been reached and the timelock has expired,
  anyone can trigger `execute_proposal`, which transfers the requested
  amount from the vault to the recipient and marks the proposal as executed
  (guarding against re-execution).

## Storage layout

- `instance()`: `Leader`, `Officers`, `Threshold`, `Token`, `Balance`,
  `ProposalCount` — small, fixed-size vault configuration held in a single
  ledger entry.
- `persistent()`: `Proposal(id)` and `Votes(id)` — one entry per proposal,
  each with its own TTL bumped on every write.

## Interface

```rust
fn initialize(env: Env, leader: Address, officers: Vec<Address>, threshold: u32, token: Address) -> Result<(), Error>;
fn deposit(env: Env, contributor: Address, amount: i128) -> Result<(), Error>;
fn create_proposal(env: Env, proposer: Address, recipient: Address, amount: i128, memo: Symbol) -> Result<u64, Error>;
fn vote_proposal(env: Env, officer: Address, proposal_id: u64, approve: bool) -> Result<(), Error>;
fn execute_proposal(env: Env, proposal_id: u64) -> Result<(), Error>;
fn get_vault_balance(env: Env) -> i128;
fn get_proposal(env: Env, proposal_id: u64) -> Result<Proposal, Error>;
```

All mutating calls (`initialize`, `deposit`, `create_proposal`,
`vote_proposal`) enforce `require_auth()` on the caller they act on behalf
of; `execute_proposal` is permissionless because the quorum + timelock
already gate the transfer.

### Errors

`AlreadyInitialized`, `NotInitialized`, `NotAuthorized`, `InvalidThreshold`,
`InvalidInput`, `ProposalNotFound`, `NotAnOfficer`, `AlreadyVoted`,
`QuorumNotReached`, `TimelockNotExpired`, `AlreadyExecuted`,
`InsufficientBalance`.

## Usage (pseudo-flow)

```text
initialize(leader, [officer_b, officer_c], threshold=2, token)
deposit(contributor, 1_000)
id = create_proposal(leader, recipient, 300, "payout")
vote_proposal(leader, id, true)
vote_proposal(officer_b, id, true)   // quorum reached (2-of-3)
// wait EXECUTION_TIMELOCK_LEDGERS ledgers
execute_proposal(id)                 // transfers 300 to recipient
```

## Testing

```bash
cargo test --manifest-path experimental/contracts/clan-treasury-vault/Cargo.toml
```

Build for wasm (optional, requires the `wasm32-unknown-unknown` target):

```bash
rustup target add wasm32-unknown-unknown
cargo build --manifest-path experimental/contracts/clan-treasury-vault/Cargo.toml \
  --target wasm32-unknown-unknown --release
```
