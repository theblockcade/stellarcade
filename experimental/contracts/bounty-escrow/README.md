# Community Bounty Escrow (Experimental)

A standalone Soroban contract for sponsor-funded arcade bounties. Sponsors
deposit a single configured token, players submit score and session-proof
hashes, and either the sponsor or the configured oracle threshold can release
the corresponding payout. Unspent tokens can be reclaimed after the deadline.

## Build and test

From this directory:

```sh
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test
```

The crate uses the same Soroban SDK release as the main contracts workspace,
but remains self-contained under `experimental/contracts/`.

## Lifecycle

1. `initialize(admin, token, oracles, oracle_threshold)` fixes the escrow token
   and an immutable set of distinct oracle addresses.
2. `post_bounty(...)` deposits a single target-score payout. The optional
   `post_bounty_with_tiers(...)` accepts increasing score thresholds and
   non-decreasing payout amounts; the sponsor deposits the sum of all tiers.
   Deadlines are UTC ledger timestamps and may be at most 30 days after posting.
   Each tier can be paid only once, so low-score claims cannot consume the
   balance reserved for higher tiers.
3. `submit_claim(player, bounty_id, score, proof_hash)` records a claim for the
   highest payout tier met by that score. A player cannot submit the same proof
   twice to one bounty; an unapproved claim does not reserve its tier or block
   another claimant from presenting that proof.
4. `approve_bounty(verifier, bounty_id, claim_id)` records one approval per
   configured oracle. The token transfer occurs only at the configured
   threshold. The sponsor may approve directly. A proof is consumed globally
   only when its approved claim is paid, preventing reuse across bounties.
5. `refund_expired(sponsor, bounty_id)` returns the remaining balance strictly
   after the deadline and closes the bounty before making the token call.

## Trust and safety notes

- Soroban authorization is required for initialization, deposits, claims,
  approvals, and refunds. Only the sponsor or a configured oracle may approve.
- A claim hash is evidence for the approvers; the contract does not verify the
  underlying game session. Oracle keys and off-chain proof validation remain
  part of the deployment's trust model.
- Claims and payouts are bounded by the amount actually held in escrow. A
  bounty cannot pay after it is refunded, exhausted, or past its deadline.
- The sponsor's direct approval is intentionally a one-party release path.
  Deployments that require strict multi-party review should use oracle approvals
  and should not rely on the sponsor path operationally.
- The contract uses a fixed token and immutable oracle set for each deployment.
  There is no admin withdrawal or oracle-rotation method.
- No contract was deployed and no wallet or live token was used during local
  development; tests use a Soroban test token.
