use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Vault {
    pub creator: Address,
    pub locked_amount: i128,
    pub unlock_time: u64,
    pub is_active: bool,
}

/// Aggregate liability across every vault tracked by the contract.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VaultLiabilitySummary {
    pub total_vaults: u32,
    pub active_vaults: u32,
    pub total_locked: i128,
    /// Portion of `total_locked` whose unlock time has passed at the
    /// current ledger timestamp (i.e. immediately withdrawable).
    pub total_unlockable: i128,
}

/// Unlock readiness for a single creator's vault.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UnlockReadiness {
    pub vault_exists: bool,
    pub is_active: bool,
    pub locked_amount: i128,
    pub unlock_time: u64,
    pub current_time: u64,
    pub is_unlockable: bool,
    /// Seconds remaining until unlock (0 once unlockable).
    pub seconds_until_unlock: u64,
}

/// Reserve health for a single vault relative to a caller-supplied minimum
/// reserve threshold.
///
/// Callers supply `min_reserve` — the minimum locked amount considered healthy.
/// The contract does not store this value.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VaultReserveSummary {
    pub vault_exists: bool,
    pub is_active: bool,
    pub locked_amount: i128,
    pub unlock_time: u64,
    pub current_time: u64,
    /// Caller-supplied minimum reserve threshold.
    pub min_reserve: i128,
    /// True when locked_amount >= min_reserve and vault is active.
    pub meets_reserve: bool,
    /// How far below the minimum the vault is (0 when meets_reserve is true).
    pub shortfall: i128,
}

/// Depletion-gap for a single vault: how much of the locked amount is already
/// unlockable (i.e. past its unlock time) vs. still locked.
///
/// Useful for dashboards that want to show how much of the reserve is at risk
/// of immediate withdrawal.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DepletionGapAccessor {
    pub vault_exists: bool,
    pub is_active: bool,
    pub locked_amount: i128,
    pub unlock_time: u64,
    pub current_time: u64,
    /// Portion already past unlock time (immediately withdrawable).
    pub unlockable_amount: i128,
    /// Portion still within the lock period.
    pub locked_remaining: i128,
    /// Fraction of total that is unlockable, in basis points (floor div).
    pub depletion_bps: u32,
}
