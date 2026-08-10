use soroban_sdk::contracttype;

#[contracttype]
#[derive(Clone, PartialEq, Eq, Debug)]
pub enum PassStatus {
    Active,
    Expired,
    NotConfigured,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct PassRecord {
    pub pass_id: u64,
    pub holder: soroban_sdk::Address,
    pub issued_at: u64,
    pub expires_at: u64,
    pub active: bool,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct HolderCoverageSummary {
    pub configured: bool,
    pub total_holders: u32,
    pub active_holders: u32,
    pub expired_passes: u32,
    pub total_issued: u64,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct ExpiryBand {
    pub pass_id: u64,
    pub configured: bool,
    pub exists: bool,
    pub status: PassStatus,
    pub issued_at: u64,
    pub expires_at: u64,
    pub now: u64,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct RedemptionReadinessSnapshot {
    pub pass_id: u64,
    pub configured: bool,
    pub exists: bool,
    pub status: PassStatus,
    pub active: bool,
    pub checked_in: bool,
    pub resale_locked: bool,
    pub ready_to_redeem: bool,
    pub issued_at: u64,
    pub expires_at: u64,
    pub now: u64,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct CheckInCoverageSummary {
    pub configured: bool,
    pub total_issued: u64,
    pub checked_in_count: u64,
    pub unchecked_count: u64,
    /// check-in rate in basis points (0..=10000)
    pub check_in_rate_bps: u32,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct ResaleLockStatus {
    pub pass_id: u64,
    pub configured: bool,
    pub exists: bool,
    pub active: bool,
    pub resale_locked: bool,
}

/// Snapshot of pass validity state for a given pass_id.
///
/// `time_remaining` is `saturating_sub(expires_at, now)` — zero when expired or missing.
/// `valid` is `true` only when the pass exists, is active, and has not yet expired.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PassValiditySnapshot {
    pub pass_id: u64,
    pub configured: bool,
    pub exists: bool,
    pub valid: bool,
    pub status: PassStatus,
    pub issued_at: u64,
    pub expires_at: u64,
    pub time_remaining: u64,
    pub now: u64,
}

/// Grace-period window for a pass.
///
/// A grace period extends the effective validity window beyond `expires_at`
/// by `grace_seconds`. `in_grace_period` is true when the pass is expired
/// but `now < expires_at + grace_seconds`. When `grace_seconds` is zero the
/// grace period is disabled and `in_grace_period` is always false.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct GracePeriodAccessor {
    pub pass_id: u64,
    pub configured: bool,
    pub exists: bool,
    pub expires_at: u64,
    pub grace_seconds: u64,
    pub grace_deadline: u64,
    pub in_grace_period: bool,
    pub now: u64,
}
