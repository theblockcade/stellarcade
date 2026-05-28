# Sponsorship Ledger Contract

This contract manages partner commitments and release schedules for sponsorships on the StellarCade platform.

## Features

- **Commitment Tracking**: Tracks total committed amounts, released amounts, and remaining balances per partner.
- **Release Schedules**: Manages a list of scheduled releases (timelocks) for each partner.
- **Administrative Controls**: Allows updating commitments, setting release schedules, and pausing/unpausing distributions.

## Interface

### Read-Only Methods

- `get_partner_commitment(partner: Address) -> PartnerCommitment`: Returns a summary of the partner's commitment.
- `get_release_schedule(partner: Address) -> ReleaseSchedule`: Returns the full release schedule for the partner.

### Mutation Methods (Administrative)

- `update_commitment(partner: Address, total_amount: i128, is_active: bool)`: Initializes or updates a commitment record.
- `set_release_schedule(partner: Address, releases: Vec<Release>)`: Sets the release schedule for a partner.
- `set_paused(partner: Address, paused: bool)`: Pauses or resumes releases for a partner.
