use soroban_sdk::contracttype;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PoolTotals {
    pub total_supplied: i128,
    pub total_borrowed: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UtilizationSnapshot {
    pub configured: bool,
    pub total_supplied: i128,
    pub total_borrowed: i128,
    pub available_liquidity: i128,
    pub utilization_bps: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LiquidationBufferSnapshot {
    pub configured: bool,
    pub liquidation_buffer_bps: u32,
    pub has_borrow_exposure: bool,
}

/// Named utilization snapshot — same semantics as `utilization_snapshot` but
/// with an explicit `healthy` flag (utilization_bps <= liquidation_buffer_bps).
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PoolUtilizationSnapshot {
    pub configured: bool,
    pub total_supplied: i128,
    pub total_borrowed: i128,
    pub available_liquidity: i128,
    pub utilization_bps: u32,
    pub liquidation_buffer_bps: u32,
    pub healthy: bool,
}

/// Interest-cooldown accessor — reports whether the pool can accrue interest now.
///
/// Callers supply `last_accrued_at` and `cooldown_seconds`. `ready` is true
/// when `now >= last_accrued_at + cooldown_seconds`. Zero `cooldown_seconds`
/// means interest is always ready to accrue.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct InterestCooldownAccessor {
    pub configured: bool,
    pub last_accrued_at: u64,
    pub cooldown_seconds: u64,
    pub cooldown_expires_at: u64,
    pub ready: bool,
    pub now: u64,
}
