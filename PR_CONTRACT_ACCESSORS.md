# Contract Accessor Implementations

This PR implements read-only accessor methods for four contracts as specified in the backlog items.

## Changes

### #962 - Contract achievements: add achievement unlock snapshot and claim-grace accessor

**Files modified:**
- `contracts/achievements/src/types.rs` - Added `AchievementUnlockSnapshot` and `ClaimGraceAccessor` types
- `contracts/achievements/src/storage.rs` - Added `ClaimGracePeriod` storage key and accessor functions
- `contracts/achievements/src/lib.rs` - Added `get_achievement_unlock_snapshot()`, `get_claim_grace_accessor()`, and `set_claim_grace_period()` methods
- `contracts/achievements/src/test.rs` - Added comprehensive tests for new accessors

**Implementation details:**
- `get_achievement_unlock_snapshot()`: Returns a summary of user's achievement progress including total, unlocked, locked counts and completion percentage
- `get_claim_grace_accessor()`: Returns grace period information including remaining ledgers and whether user is within grace period
- Handles empty/missing states gracefully with zeroed fallback values
- Added tests for success path, empty state, expired grace period, and missing grace period

### #963 - Contract arena-ladder: add arena ranking summary and season-cutoff accessor

**Files modified:**
- `contracts/arena-ladder/src/types.rs` - Added `ArenaRankingSummary` and `SeasonCutoffAccessor` types
- `contracts/arena-ladder/src/storage.rs` - Added season cutoff storage functions
- `contracts/arena-ladder/src/lib.rs` - Added `arena_ranking_summary()`, `season_cutoff_accessor()`, and `set_season_cutoff()` methods
- `contracts/arena-ladder/src/test.rs` - Added comprehensive tests for new accessors

**Implementation details:**
- `arena_ranking_summary()`: Aggregates data across all brackets including total players, active promotions, average pressure score, and critical bracket count
- `season_cutoff_accessor()`: Returns season cutoff information including whether season is active and ledgers until cutoff
- Handles missing seasons gracefully with zeroed fallback values
- Added tests for success path, empty state, active season, expired season, and missing season

### #965 - Contract asset-escrow-v3: add escrow balance summary and release-cooldown accessor

**Files modified:**
- `contracts/asset-escrow-v3/src/types.rs` - Added `ReleaseCooldownAccessor` type
- `contracts/asset-escrow-v3/src/storage.rs` - Added `get_release_cooldown()` function
- `contracts/asset-escrow-v3/src/lib.rs` - Added `get_release_cooldown()` public method
- `contracts/asset-escrow-v3/src/test.rs` - Added tests for release cooldown accessor

**Implementation details:**
- `get_release_cooldown()`: Returns release cooldown information including whether lock is in cooldown, can release status, and remaining ledgers
- Builds on existing `get_balance_lock_summary()` and `get_unlock_readiness()` methods
- Handles missing locks gracefully by treating as releasable
- Added tests for in-cooldown state, ready state, and missing lock

### #966 - Contract badge-claims-v2: add badge claim snapshot and validation-delay accessor

**Files modified:**
- `contracts/badge-claims-v2/src/types.rs` - Added `ValidationDelayAccessor` type
- `contracts/badge-claims-v2/src/storage.rs` - Added validation delay storage functions
- `contracts/badge-claims-v2/src/lib.rs` - Added `get_validation_delay_accessor()` and `set_validation_delay()` methods
- `contracts/badge-claims-v2/src/test.rs` - Added tests for validation delay accessor

**Implementation details:**
- `get_validation_delay_accessor()`: Returns validation delay information including whether validation is delayed, pending amount, and ledgers until validation
- Builds on existing `get_pending_claim_snapshot()` method
- Handles missing validation delays gracefully with zeroed fallback values
- Added tests for success path, expired delay, and missing delay

## Testing

All implementations include:
- Unit tests for main success paths
- Coverage for empty/missing state scenarios
- Tests for edge cases (expired periods, missing data)
- All tests follow existing contract test patterns

## Acceptance Criteria Met

- ✅ Consumers can retrieve new state through stable contract reads
- ✅ Unknown IDs and empty states return predictable results
- ✅ Existing write flows remain backward compatible
- ✅ Named response types used instead of opaque tuples
- ✅ Storage aggregates reused where possible
- ✅ Fallback values and zero-state behavior documented
- ✅ Unit tests added for success paths
- ✅ Coverage for empty/blocked/missing-state paths

## Definition of Done

- ✅ Contract changes implemented and covered by tests
- ✅ Public interfaces follow existing patterns
- ✅ Storage invariants preserved
- ✅ Backward compatible with existing write flows

Closes #962, #963, #965, #966
