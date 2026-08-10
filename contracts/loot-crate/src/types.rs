use soroban_sdk::contracttype;

// Re-export so lib.rs can use a single import path


#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum CrateAvailabilityState {
    Missing,
    Available,
    SoldOut,
    Paused,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CrateData {
    pub crate_id: u64,
    pub total_supply: u32,
    pub minted_supply: u32,
    pub paused: bool,
    pub common_count: u32,
    pub rare_count: u32,
    pub epic_count: u32,
    pub legendary_count: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CrateAvailabilitySnapshot {
    pub crate_id: u64,
    pub exists: bool,
    pub state: CrateAvailabilityState,
    pub total_supply: u32,
    pub minted_supply: u32,
    pub remaining_supply: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RarityDistributionSnapshot {
    pub crate_id: u64,
    pub exists: bool,
    pub configured: bool,
    pub common_bps: u32,
    pub rare_bps: u32,
    pub epic_bps: u32,
    pub legendary_bps: u32,
}

/// Detailed contents-availability snapshot combining supply and rarity data.
///
/// `openable` is true when the crate exists, is not paused, and has remaining supply.
/// Rarity breakdowns are in basis points (floor division; sum may be < 10_000 due to truncation).
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ContentsAvailabilitySnapshot {
    pub crate_id: u64,
    pub exists: bool,
    pub state: CrateAvailabilityState,
    pub openable: bool,
    pub total_supply: u32,
    pub minted_supply: u32,
    pub remaining_supply: u32,
    pub common_bps: u32,
    pub rare_bps: u32,
    pub epic_bps: u32,
    pub legendary_bps: u32,
}

/// Open-cooldown accessor — computes whether a crate can be opened now or is
/// on cooldown.
///
/// The contract does not store a per-crate cooldown; callers supply
/// `last_opened_at` (the ledger timestamp of the user's last open) and
/// `cooldown_seconds`. `ready` is true when `now >= last_opened_at + cooldown_seconds`.
/// When `cooldown_seconds` is zero the crate has no cooldown and `ready` is
/// always true (provided the crate exists and is openable).
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct OpenCooldownAccessor {
    pub crate_id: u64,
    pub exists: bool,
    pub openable: bool,
    pub last_opened_at: u64,
    pub cooldown_seconds: u64,
    pub cooldown_expires_at: u64,
    pub ready: bool,
    pub now: u64,
}
