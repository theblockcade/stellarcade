use soroban_sdk::{contracttype, Address};

pub const PERSISTENT_BUMP: u32 = 518_400; // ~30 days

/// Basis points denominator (100% = 10_000 bps).
pub const BPS_DENOMINATOR: i128 = 10_000;

#[contracttype]
pub enum DataKey {
    Admin,
    /// AffiliateRecord for a given affiliate address.
    Affiliate(Address),
    /// i128 — minimum payout threshold (token-smallest-unit).
    MinPayoutThreshold,
    /// u32 — commission rate in basis points.
    CommissionBps,
    Paused,
}
