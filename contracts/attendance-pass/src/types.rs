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
