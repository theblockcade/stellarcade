use soroban_sdk::{contracttype, Address};

/// Lifecycle of a single vault claim.
#[contracttype]
#[derive(Clone, PartialEq, Eq, Debug)]
pub enum ClaimState {
    /// No claim record found for the queried id.
    Unknown,
    /// Vault has not been initialised yet.
    NotConfigured,
    /// Claim is waiting for its release window to open.
    Pending,
    /// Claim's release window is open and the beneficiary may withdraw.
    Releasable,
    /// Claim has been fully released.
    Released,
    /// Claim was cancelled before release.
    Cancelled,
}

/// On-chain record of a single claim against the vault.
#[contracttype]
#[derive(Clone, Debug)]
pub struct VaultClaim {
    pub claim_id: u64,
    pub beneficiary: Address,
    pub token: Address,
    pub amount: i128,
    /// Earliest ledger timestamp at which `release` may be called.
    pub release_after: u64,
    pub released: bool,
    pub cancelled: bool,
}

/// Aggregate view of every outstanding claim. `outstanding_amount` is the
/// total `amount` summed over claims that are neither released nor cancelled.
#[contracttype]
#[derive(Clone, Debug)]
pub struct OutstandingClaimSummary {
    pub configured: bool,
    pub outstanding_count: u32,
    pub outstanding_amount: i128,
    pub released_count: u32,
    pub released_amount: i128,
    pub cancelled_count: u32,
    pub cancelled_amount: i128,
    pub now: u64,
}

/// Read-only window snapshot for a single claim.
#[contracttype]
#[derive(Clone, Debug)]
pub struct ReleaseWindow {
    pub claim_id: u64,
    pub configured: bool,
    pub exists: bool,
    pub state: ClaimState,
    pub amount: i128,
    pub release_after: u64,
    pub now: u64,
    /// Seconds remaining until the claim becomes releasable (0 once open).
    pub seconds_until_releasable: u64,
}

/// Reserve exposure snapshot backed by existing aggregate counters.
///
/// `exposure_bps` is floored as
/// `outstanding_amount * 10_000 / total_tracked_amount`. Empty and
/// unconfigured vaults return `exposure_bps = 0`.
#[contracttype]
#[derive(Clone, Debug)]
pub struct ReserveExposureSnapshot {
    pub configured: bool,
    pub outstanding_count: u32,
    pub outstanding_amount: i128,
    pub released_amount: i128,
    pub cancelled_amount: i128,
    pub total_tracked_amount: i128,
    pub exposure_bps: u32,
    pub now: u64,
}

/// Aggregate release queue read model.
///
/// `pending_amount` includes outstanding claims whose release window has not
/// opened. `releasable_amount` includes outstanding claims whose window is
/// open. Empty, unconfigured, and pre-index records return zero queue values.
#[contracttype]
#[derive(Clone, Debug)]
pub struct ReleaseQueueAccessor {
    pub configured: bool,
    pub indexed_claims: u32,
    pub pending_count: u32,
    pub pending_amount: i128,
    pub releasable_count: u32,
    pub releasable_amount: i128,
    pub next_release_after: u64,
    pub now: u64,
}
