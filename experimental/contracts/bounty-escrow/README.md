# Bounty Escrow Contract

A Soroban smart contract for managing community arcade bounties with sponsor-funded prize pools, milestone claims, and multi-sig oracle verification.

## Features
- **Sponsor Bounties**: Post bounties with prize tokens and target scores.
- **Player Claims**: Submit game session proof hashes for bounty eligibility.
- **Oracle Verification**: Multi-sig approval for claim validation.
- **Expiration Handling**: Automatic refunds for unclaimed bounties.
- **Tiered Payouts**: Partial bounty distribution for tiered objectives.

## Methods

### `post_bounty`
```rust
post_bounty(env, sponsor, target_game, target_score, amount, deadline)
```

### `submit_claim`
```rust
submit_claim(env, player, bounty_id, proof_hash)
```

### `approve_bounty`
```rust
approve_bounty(env, verifier, bounty_id)
```

## Security
- **Authorization**: `.require_auth()` on sponsor, claimant, and verifier actions.
- **Expiration Checks**: Prevents approval of expired bounties.
- **Fund Safety**: Refunds unclaimed bounties to sponsors.

## Testing
- Sponsor bounty deposit and successful claim approval.
- Expired bounty refund to sponsor.
- Unauthorized claim approval rejection.

## License
Apache-2.0
