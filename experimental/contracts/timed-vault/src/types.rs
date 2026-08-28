use soroban_sdk::{contracttype, Address};

/// Multiplier precision: 10_000 == 1.0x, matching basis-point conventions
/// used elsewhere in this workspace (see penalty-escrow's slash_bps).
pub const MULTIPLIER_DENOMINATOR: u128 = 10_000;

/// Supported lockup periods, in seconds.
pub const LOCK_7_DAYS_SEC: u64 = 7 * 24 * 60 * 60;
pub const LOCK_30_DAYS_SEC: u64 = 30 * 24 * 60 * 60;
pub const LOCK_90_DAYS_SEC: u64 = 90 * 24 * 60 * 60;

/// Multiplier (in basis points of MULTIPLIER_DENOMINATOR) for each supported lockup tier.
pub const MULTIPLIER_7_DAYS: u128 = 10_000; // 1.0x
pub const MULTIPLIER_30_DAYS: u128 = 15_000; // 1.5x
pub const MULTIPLIER_90_DAYS: u128 = 25_000; // 2.5x

/// Emergency early-withdrawal penalty, in basis points of the principal (10% = 1_000 bps).
pub const EMERGENCY_PENALTY_BPS: u128 = 1_000;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum PositionStatus {
    Active,
    Withdrawn,
    EmergencyWithdrawn,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VaultPosition {
    pub position_id: u64,
    pub user: Address,
    pub principal: u128,
    /// Payout multiplier in basis points of MULTIPLIER_DENOMINATOR.
    pub multiplier_bps: u128,
    pub lock_duration_sec: u64,
    pub deposited_at: u64,
    pub matures_at: u64,
    pub status: PositionStatus,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PositionSummary {
    pub position_id: u64,
    pub user: Address,
    pub principal: u128,
    pub multiplier_bps: u128,
    pub lock_duration_sec: u64,
    pub deposited_at: u64,
    pub matures_at: u64,
    pub status: PositionStatus,
    /// Payout the position would currently yield via standard withdrawal,
    /// i.e. principal * multiplier_bps / MULTIPLIER_DENOMINATOR. This is
    /// only claimable once matured; see `is_mature`.
    pub projected_payout: u128,
    pub is_mature: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VaultPayout {
    pub position_id: u64,
    pub principal: u128,
    pub amount_paid: u128,
    pub penalty_paid: u128,
    pub was_emergency: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VaultGlobalStats {
    pub total_positions: u64,
    pub active_positions: u64,
    pub total_deposited: u128,
    pub total_withdrawn: u128,
    pub total_penalties_collected: u128,
}
