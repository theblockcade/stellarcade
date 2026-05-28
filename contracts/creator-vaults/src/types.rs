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
