# Requirements Document

## Introduction

The bounty-escrow contract is a Soroban smart contract that holds funds in escrow for bounty work. Currently the contract lacks public read-only methods, making it impossible for frontend and backend consumers to inspect bounty state, platform configuration, or aggregate statistics without reconstructing context from scattered sources. This feature adds a complete set of read-only contract methods and the supporting types, storage helpers, and unit tests needed to expose that state in a stable, structured way.

## Glossary

- **BountyEscrow**: The Soroban smart contract being extended; manages escrow funds for bounties.
- **Bounty**: A funded work item held in escrow, identified by a `u64` bounty_id.
- **Poster**: The `Address` that created and funded a bounty.
- **BountyStatus**: The lifecycle stage of a bounty (`Open`, `Paused`, `Cancelled`, `Completed`).
- **PlatformConfig**: Admin-controlled configuration stored in instance storage (fee basis points, token address, admin address).
- **BountyRecord**: The persistent storage struct representing a single bounty's full state.
- **BountyView**: The named response type returned to callers for a single bounty read.
- **BountyStatusView**: The named response type returned for a status-only read.
- **PlatformConfigView**: The named response type returned for a platform configuration read.
- **BountySummary**: The named response type returned for aggregate statistics.
- **DataKey**: The `contracttype` enum used as storage keys.
- **Consumer**: Any frontend or backend service that calls the contract's read methods.

---

## Requirements

### Requirement 1: Single Bounty Read

**User Story:** As a consumer, I want to retrieve the full state of a single bounty by its ID, so that I can display or process its details without reconstructing context from other sources.

#### Acceptance Criteria

1. WHEN a consumer calls `get_bounty` with a valid `bounty_id`, THE BountyEscrow SHALL return a `BountyView` containing the bounty_id, poster address, reward amount, status, expiry ledger, and description.
2. WHEN a consumer calls `get_bounty` with an unknown `bounty_id`, THE BountyEscrow SHALL return a `BountyView` with `exists` set to `false` and all optional fields set to `None`.
3. THE BountyEscrow SHALL NOT require any authentication to call `get_bounty`.
4. WHEN a bounty has `BountyStatus::Paused`, THE BountyEscrow SHALL include that status in the returned `BountyView` without modification.

### Requirement 2: Bounties by Poster

**User Story:** As a consumer, I want to retrieve all bounties posted by a specific address, so that I can display a poster's activity history.

#### Acceptance Criteria

1. WHEN a consumer calls `get_bounties_by_poster` with a `poster` address that has posted at least one bounty, THE BountyEscrow SHALL return a `Vec<BountyView>` containing one entry per bounty posted by that address.
2. WHEN a consumer calls `get_bounties_by_poster` with a `poster` address that has posted no bounties, THE BountyEscrow SHALL return an empty `Vec<BountyView>`.
3. THE BountyEscrow SHALL NOT require any authentication to call `get_bounties_by_poster`.
4. WHEN multiple bounties exist for the same poster, THE BountyEscrow SHALL include all of them in the returned `Vec<BountyView>`.

### Requirement 3: Bounty Status Read

**User Story:** As a consumer, I want to retrieve only the status of a bounty by its ID, so that I can make lightweight polling calls without fetching the full record.

#### Acceptance Criteria

1. WHEN a consumer calls `get_bounty_status` with a valid `bounty_id`, THE BountyEscrow SHALL return a `BountyStatusView` containing the `bounty_id`, `exists: true`, and the current `BountyStatus`.
2. WHEN a consumer calls `get_bounty_status` with an unknown `bounty_id`, THE BountyEscrow SHALL return a `BountyStatusView` with `exists: false` and `status` set to a defined zero-state sentinel value.
3. THE BountyEscrow SHALL NOT require any authentication to call `get_bounty_status`.

### Requirement 4: Platform Configuration Read

**User Story:** As a consumer, I want to retrieve the current platform configuration, so that I can display fee information and verify the contract is initialized before submitting transactions.

#### Acceptance Criteria

1. WHEN a consumer calls `get_platform_config` after the contract has been initialized, THE BountyEscrow SHALL return a `PlatformConfigView` containing the admin address, token address, and fee basis points.
2. WHEN a consumer calls `get_platform_config` before the contract has been initialized, THE BountyEscrow SHALL return a `PlatformConfigView` with `initialized: false` and all optional fields set to `None`.
3. THE BountyEscrow SHALL NOT require any authentication to call `get_platform_config`.

### Requirement 5: Aggregate Bounty Summary

**User Story:** As a consumer, I want to retrieve aggregate statistics across all bounties, so that I can display platform-wide metrics without iterating over individual records.

#### Acceptance Criteria

1. WHEN a consumer calls `get_bounty_summary` on a contract with no bounties, THE BountyEscrow SHALL return a `BountySummary` with all counts set to `0` and `total_escrowed` set to `0`.
2. WHEN a consumer calls `get_bounty_summary` on a contract with bounties in various states, THE BountyEscrow SHALL return a `BountySummary` with `open_count`, `paused_count`, `completed_count`, `cancelled_count`, and `total_escrowed` reflecting the current state of all bounties.
3. THE BountyEscrow SHALL compute `total_escrowed` by summing the reward amounts of all bounties with `BountyStatus::Open` or `BountyStatus::Paused`.
4. THE BountyEscrow SHALL NOT require any authentication to call `get_bounty_summary`.

### Requirement 6: Backward Compatibility

**User Story:** As a platform operator, I want the existing write flows to remain unchanged after the read methods are added, so that no existing integrations break.

#### Acceptance Criteria

1. WHEN the read-only methods are added, THE BountyEscrow SHALL preserve all existing `DataKey` variants and their storage semantics without modification.
2. WHEN the read-only methods are added, THE BountyEscrow SHALL preserve all existing write method signatures without modification.
3. THE BountyEscrow SHALL reuse the existing `AllIds` storage aggregate to enumerate bounties rather than introducing a duplicate counter.

### Requirement 7: Predictable Zero-State and Error Behavior

**User Story:** As a consumer, I want all read methods to return predictable results for missing or unconfigured state, so that I can handle those cases without catching panics.

#### Acceptance Criteria

1. IF a `bounty_id` does not exist in storage, THEN THE BountyEscrow SHALL return a response struct with `exists: false` rather than panicking.
2. IF the contract has not been initialized, THEN THE BountyEscrow SHALL return a `PlatformConfigView` with `initialized: false` rather than panicking.
3. THE BountyEscrow SHALL document the zero-state fallback value for every optional field in the response types.
