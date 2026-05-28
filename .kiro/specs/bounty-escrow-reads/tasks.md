# Implementation Plan: bounty-escrow-reads

## Overview

Implement the bounty-escrow contract from scratch following the four-file layout used by sibling contracts (`lib.rs`, `storage.rs`, `types.rs`, `test.rs`). The work is broken into incremental steps: types first, then storage helpers, then the contract scaffold with write paths, then the read-only methods, and finally tests.

## Tasks

- [x] 1. Bootstrap the contract crate
  - Create `contracts/bounty-escrow/Cargo.toml` with `name = "stellarcade-bounty-escrow"`, `soroban-sdk = "25.0.2"`, and `crate-type = ["cdylib", "rlib"]`
  - Add `bounty-escrow` to the `[workspace]` members list in `contracts/Cargo.toml`
  - Create stub `contracts/bounty-escrow/src/lib.rs`, `storage.rs`, `types.rs`, `test.rs` files so the crate compiles
  - _Requirements: 6.1, 6.2_

- [x] 2. Define types in `types.rs`
  - [x] 2.1 Implement `BountyStatus` enum (`Open`, `Paused`, `Completed`, `Cancelled`) with `#[contracttype]`, `Clone`, `Debug`, `Eq`, `PartialEq`
    - _Requirements: 1.1, 3.1, 5.2_
  - [x] 2.2 Implement `BountyRecord` struct with fields: `bounty_id: u64`, `poster: Address`, `reward: i128`, `status: BountyStatus`, `expiry_ledger: u32`, `description: Symbol`
    - _Requirements: 1.1_
  - [x] 2.3 Implement `BountyView` response struct with `exists: bool` and all other fields as `Option<_>`; add doc comments for zero-state fallback values
    - _Requirements: 1.1, 1.2, 7.3_
  - [x] 2.4 Implement `BountyStatusView` response struct with `bounty_id: u64`, `exists: bool`, `status: Option<BountyStatus>`; add doc comments
    - _Requirements: 3.1, 3.2, 7.3_
  - [x] 2.5 Implement `PlatformConfigView` response struct with `initialized: bool`, `admin: Option<Address>`, `token: Option<Address>`, `fee_bps: Option<u32>`; add doc comments
    - _Requirements: 4.1, 4.2, 7.3_
  - [x] 2.6 Implement `BountySummary` response struct with `open_count: u64`, `paused_count: u64`, `completed_count: u64`, `cancelled_count: u64`, `total_escrowed: i128`; add doc comments
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 3. Define storage keys and helpers in `storage.rs` and `lib.rs`
  - [x] 3.1 Define `DataKey` enum in `lib.rs` with variants: `Admin`, `Token`, `FeeBps`, `NextBountyId`, `AllIds`, `Bounty(u64)`, `PosterIndex(Address)`
    - _Requirements: 6.1, 6.3_
  - [x] 3.2 Implement `storage::get_bounty` and `storage::set_bounty` using `persistent()` storage with TTL bump (pattern from `anti-cheat-bounties`)
    - _Requirements: 1.1, 6.1_
  - [x] 3.3 Implement `storage::get_all_ids` and `storage::push_bounty_id` using `instance()` storage with `AllIds` key
    - _Requirements: 5.2, 6.3_
  - [x] 3.4 Implement `storage::get_poster_index` and `storage::push_poster_index` using `instance()` storage with `PosterIndex(Address)` key
    - _Requirements: 2.1, 2.2_

- [x] 4. Implement contract init and write paths in `lib.rs`
  - [x] 4.1 Implement `init(env, admin, token, fee_bps)` — stores `Admin`, `Token`, `FeeBps`, `NextBountyId = 1` in instance storage; panics if already initialized
    - _Requirements: 4.1, 6.2_
  - [x] 4.2 Implement `post_bounty(env, poster, reward, expiry_ledger, description)` — validates inputs, assigns next ID, writes `BountyRecord` to persistent storage, appends to `AllIds` and `PosterIndex(poster)`
    - _Requirements: 2.1, 5.2, 6.2_
  - [x] 4.3 Implement `update_bounty_status(env, admin, bounty_id, new_status)` — admin-only, updates status on existing `BountyRecord`
    - _Requirements: 6.2_

- [x] 5. Checkpoint — ensure the crate compiles and existing write paths work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement read-only methods in `lib.rs`
  - [x] 6.1 Implement `get_bounty(env, bounty_id) -> BountyView` — returns populated view when found, zero-state view when not found; no auth
    - _Requirements: 1.1, 1.2, 1.3, 7.1_
  - [x] 6.2 Implement `get_bounties_by_poster(env, poster) -> Vec<BountyView>` — reads `PosterIndex(poster)`, maps each ID to `BountyView` via `get_bounty`; returns empty vec when no bounties; no auth
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 6.3 Implement `get_bounty_status(env, bounty_id) -> BountyStatusView` — returns status view when found, zero-state when not found; no auth
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 6.4 Implement `get_platform_config(env) -> PlatformConfigView` — reads `Admin`, `Token`, `FeeBps` from instance storage; returns `initialized: false` view when any key is absent; no auth
    - _Requirements: 4.1, 4.2, 4.3, 7.2_
  - [x] 6.5 Implement `get_bounty_summary(env) -> BountySummary` — iterates `AllIds`, accumulates per-status counts and `total_escrowed` using `saturating_add`; returns all-zero struct when no bounties; no auth
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 7. Write unit tests in `test.rs`
  - [x] 7.1 Write `test_get_bounty_success` — post a bounty, call `get_bounty`, assert `exists: true` and all fields match
    - **Property 1: get_bounty round-trip consistency**
    - **Validates: Requirements 1.1**
  - [ ]* 7.2 Write `test_get_bounty_paused_status` — post a bounty, update status to `Paused`, call `get_bounty`, assert status is `Paused`
    - **Property 1 edge case: Paused status preserved**
    - **Validates: Requirements 1.4**
  - [x] 7.3 Write `test_get_bounty_missing` — call `get_bounty` with an unused ID, assert `exists: false` and all `Option` fields are `None`
    - **Property 2: get_bounty missing-ID zero-state**
    - **Validates: Requirements 1.2, 7.1**
  - [x] 7.4 Write `test_get_bounties_by_poster_success` — post two bounties from the same poster, call `get_bounties_by_poster`, assert length is 2 and both entries have correct poster
    - **Property 3: get_bounties_by_poster completeness**
    - **Validates: Requirements 2.1, 2.4**
  - [ ]* 7.5 Write `test_get_bounties_by_poster_empty` — call `get_bounties_by_poster` for an address that never posted, assert empty vec
    - **Property 3 edge case: empty poster**
    - **Validates: Requirements 2.2**
  - [x] 7.6 Write `test_get_bounty_status_success` — post a bounty, call `get_bounty_status`, assert `exists: true` and status matches `get_bounty` status
    - **Property 4: get_bounty_status consistency with get_bounty**
    - **Validates: Requirements 3.1**
  - [ ]* 7.7 Write `test_get_bounty_status_missing` — call `get_bounty_status` with unused ID, assert `exists: false` and `status: None`
    - **Property 4 edge case: missing status**
    - **Validates: Requirements 3.2, 7.1**
  - [x] 7.8 Write `test_get_platform_config_initialized` — init contract, call `get_platform_config`, assert `initialized: true` and all fields match init args
    - **Property 5: get_platform_config round-trip**
    - **Validates: Requirements 4.1**
  - [x] 7.9 Write `test_get_platform_config_uninitialized` — call `get_platform_config` before init, assert `initialized: false` and all `Option` fields are `None`
    - **Validates: Requirements 4.2, 7.2**
  - [x] 7.10 Write `test_get_bounty_summary_empty` — call `get_bounty_summary` with no bounties, assert all counts and `total_escrowed` are 0
    - **Validates: Requirements 5.1**
  - [x] 7.11 Write `test_get_bounty_summary_mixed_states` — post bounties in all four statuses with distinct rewards, call `get_bounty_summary`, assert each count is correct and `total_escrowed` equals sum of Open+Paused rewards only
    - **Property 6: get_bounty_summary count invariant**
    - **Property 7: get_bounty_summary total_escrowed invariant**
    - **Validates: Requirements 5.2, 5.3**

- [x] 8. Final checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All read methods must use `env.storage().instance()` or `env.storage().persistent()` directly — no `require_auth()` calls
- Use `saturating_add` for all accumulations in `get_bounty_summary` to avoid overflow panics
- TTL bump constants (`BUMP_AMOUNT`, `LIFETIME_THRESHOLD`) should follow the same values as `anti-cheat-bounties` (518_400 / 259_200)
- The `PosterIndex` key is populated during `post_bounty` — reads are O(1) per poster, not a full scan
